import { useState, useCallback, useRef } from 'react';
import { fetchSearchResults } from '../utils/tavily.js';

const MODELS = {
  primary: 'gemini-2.5-flash',
  fallback: 'gemini-2.0-flash',
};

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

const SYSTEM_PROMPT = `You are a misinformation detection engine. Analyze the given article and return ONLY a valid JSON object. No markdown, no preamble, no text outside the JSON.

IMPORTANT: Keep "annotatedText" concise — maximum 3000 characters. If the article is longer, annotate only the most important sections.

Return this exact structure:
{
  "credibilityScore": <number 0-100>,
  "biasDirection": "<Left-leaning | Right-leaning | Corporate | Sensationalist | Neutral>",
  "tone": "<Fear-inducing | Neutral | Persuasive>",
  "readingLevel": "<Simple | Moderate | Complex>",
  "signals": {
    "emotionalLanguageCount": <number>,
    "emotionalPhrases": ["phrase1", "phrase2"],
    "unsourcedClaimsCount": <number>,
    "unsourcedClaims": ["claim1", "claim2"],
    "absoluteStatements": ["statement1", "statement2"],
    "absoluteStatementsCount": <number>
  },
  "claims": [
    {
      "text": "<extracted factual claim — keep under 120 chars>",
      "verifiability": "<Named Source | Anonymous Source | No Source>",
      "confidence": "<Verified | Unverified | Contradicted>"
    }
  ],
  "missingContext": [
    "<what this article omits that a reader should know>",
    "<second missing context point>",
    "<third missing context point>"
  ],
  "annotatedText": "<article excerpt (max 3000 chars) with flagged phrases wrapped in: [EMOTIONAL]phrase[/EMOTIONAL], [UNSOURCED]phrase[/UNSOURCED], [ABSOLUTE]phrase[/ABSOLUTE]>",
  "searchQuery": "<concise 3-5 word search query for NewsAPI to find related articles>"
}`;

const SEARCH_SYSTEM_PROMPT = `You are a real-time fact-checking system. Return ONLY a valid JSON object. No markdown fences.

Tasks:
1. Determine if the statement is TRUE, FALSE, or UNCERTAIN based on the provided recent web information.
2. Assign a credibility score (0–100%).
3. Explain reasoning clearly using the web information.
4. Mention if sources agree or conflict.
Keep the explanation simple, clear, and user-friendly.

IMPORTANT: Return exactly this JSON structure:
{
  "isLiveSearch": true,
  "credibilityScore": <number 0-100>,
  "label": "<TRUE | FALSE | UNCERTAIN>",
  "explanation": "<your explanation here>",
  "annotatedText": ""
}`;

function isQuotaError(message = '') {
  return (
    message.includes('quota') ||
    message.includes('RESOURCE_EXHAUSTED') ||
    message.includes('rate limit') ||
    message.includes('429')
  );
}

function parseRetrySeconds(message = '') {
  const match = message.match(/retry in ([\d.]+)s/i);
  return match ? Math.ceil(parseFloat(match[1])) : null;
}

/**
 * Attempts to repair a truncated or markdown-wrapped JSON string from Gemini.
 * Now that we removed responseMimeType, Gemini might include markdown or preamble.
 */
function repairTruncatedJson(raw) {
  if (!raw || !raw.trim()) throw new Error("Empty response from model");

  let text = raw.trim();

  // 1. Extract just the JSON part (ignore preamble/markdown)
  const firstBrace = text.indexOf('{');
  if (firstBrace === -1) {
    throw new Error("No JSON object found in response");
  }
  
  // Find the last closing brace. If it got cut off, it might not exist, 
  // so we take everything from the first brace to the end.
  const lastBrace = text.lastIndexOf('}');
  if (lastBrace !== -1 && lastBrace > firstBrace) {
    text = text.slice(firstBrace, lastBrace + 1);
  } else {
    text = text.slice(firstBrace);
  }

  // If it parses fine normally, return it
  try { return JSON.parse(text); } catch { /* proceed to repair */ }

  // Strategy 1: Truncated inside "annotatedText" — drop it and close the object
  const annotatedKeyIdx = text.lastIndexOf('"annotatedText"');
  if (annotatedKeyIdx !== -1) {
    const beforeAnnotated = text.slice(0, annotatedKeyIdx).trimEnd().replace(/,\s*$/, '');
    const CLOSE = '\n  "annotatedText": ""\n}';
    try { return JSON.parse(beforeAnnotated + CLOSE); } catch { /* fall through */ }
  }

  // Strategy 2: Remove the last incomplete key-value pair after the last complete comma
  const lastComma = text.lastIndexOf(',\n  "');
  if (lastComma !== -1) {
    try { return JSON.parse(text.slice(0, lastComma) + '\n}'); } catch { /* fall through */ }
  }

  // Strategy 3: Brute-force close unclosed strings / brackets / braces
  let repaired = text;
  let braces = 0, brackets = 0, inString = false, escaped = false;
  for (let i = 0; i < repaired.length; i++) {
    const ch = repaired[i];
    if (escaped) { escaped = false; continue; }
    if (ch === '\\' && inString) { escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') braces++;
    else if (ch === '}') braces--;
    else if (ch === '[') brackets++;
    else if (ch === ']') brackets--;
  }

  if (inString) repaired += '"';
  repaired += ']'.repeat(Math.max(0, brackets));
  repaired += '}'.repeat(Math.max(0, braces));

  return JSON.parse(repaired);
}

async function callGemini(model, apiKey, text, searchContext = null) {
  const url = `${BASE_URL}/${model}:generateContent?key=${apiKey}`;
  
  let systemPrompt = SYSTEM_PROMPT;
  let userText = `Analyze this article:\n\n${text}`;
  
  if (searchContext) {
    systemPrompt = SEARCH_SYSTEM_PROMPT;
    userText = `User Statement:\n${text}\n\nRecent Web Information:\n${searchContext}`;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: userText }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
        maxOutputTokens: 8192,
      },
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `API error: ${response.status}`);
  }

  const data = await response.json();

  // Check finish reason — MAX_TOKENS means truncation
  const finishReason = data?.candidates?.[0]?.finishReason;
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) throw new Error('Empty response from Gemini API');

  try {
    const parsed = finishReason === 'MAX_TOKENS'
      ? repairTruncatedJson(rawText)
      : JSON.parse(rawText);
    return { parsed };
  } catch {
    // Last resort: try repair regardless
    const parsed = repairTruncatedJson(rawText);
    return { parsed };
  }
}

// Uses Gemini's url_context tool to fetch + analyze a URL in one API call
async function callGeminiWithUrl(model, apiKey, articleUrl) {
  const url = `${BASE_URL}/${model}:generateContent?key=${apiKey}`;
  // NOTE: responseMimeType:'application/json' is INCOMPATIBLE with url_context tool.
  // We omit it and instruct via prompt instead, then parse the text response manually.
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{
        role: 'user',
        parts: [{ text: `Fetch and analyze the news article at this URL for misinformation.\n\nCRITICAL: Return ONLY a raw JSON object — no markdown fences, no commentary, nothing outside the JSON braces.\n\nURL: ${articleUrl}` }],
      }],
      tools: [{ url_context: {} }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 8192,
      },
    }),
    signal: AbortSignal.timeout(90000),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `API error: ${response.status}`);
  }

  const data = await response.json();

  const finishReason = data?.candidates?.[0]?.finishReason;

  // Extract fetched article text from grounding chunks for display
  const groundingChunks = data?.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const fetchedSnippet = groundingChunks
    .map(c => c?.web?.snippet || c?.retrievedContext?.text || '')
    .filter(Boolean)
    .join('\n\n');

  // Get page title from url_context_metadata
  const urlMeta = data?.candidates?.[0]?.urlContextMetadata?.urlMetadata;
  const pageTitle = urlMeta?.[0]?.title || null;

  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) throw new Error('Empty response from Gemini API');

  try {
    const parsed = finishReason === 'MAX_TOKENS'
      ? repairTruncatedJson(rawText)
      : JSON.parse(rawText);
    return { parsed, fetchedSnippet, pageTitle };
  } catch {
    const parsed = repairTruncatedJson(rawText);
    return { parsed, fetchedSnippet, pageTitle };
  }
}

export function useGeminiAnalysis() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [modelUsed, setModelUsed] = useState(null);
  const [retryIn, setRetryIn] = useState(null);
  const retryTimerRef = useRef(null);

  const startRetryCountdown = useCallback((seconds) => {
    setRetryIn(seconds);
    if (retryTimerRef.current) clearInterval(retryTimerRef.current);
    retryTimerRef.current = setInterval(() => {
      setRetryIn(prev => {
        if (prev <= 1) {
          clearInterval(retryTimerRef.current);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const analyze = useCallback(async (text) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_key_here') {
      setError('Please set your VITE_GEMINI_API_KEY in the .env file.');
      return null;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setModelUsed(null);
    setRetryIn(null);

    // Smart Detection: Check if query needs live search
    const lowerText = text.toLowerCase();
    const isRecent = /(2025|2026|latest|recent|today|breaking)/.test(lowerText);
    
    let searchContext = null;
    let fallbackSearchUsed = false;
    let usedSources = [];

    if (isRecent) {
      console.info("Recent topic detected. Fetching live data...");
      setLoading('Verifying with live data...');
      const results = await fetchSearchResults(text);
      if (results === null) {
        // API failed, fallback to normal flow
        console.warn("Tavily API failed. Falling back to normal Gemini flow.");
      } else if (results.length > 0) {
        usedSources = results.slice(0, 3);
        searchContext = results.slice(0, 3).map((r, i) => `Source ${i + 1}: ${r.title} - ${r.content}`).join('\n\n');
        fallbackSearchUsed = true;
      } else {
        // API succeeded but no results -> Insufficient real-time data
        setLoading(false);
        setError("Insufficient real-time data");
        return null;
      }
    }

    // Try primary model first
    try {
      let { parsed } = await callGemini(MODELS.primary, apiKey, text, searchContext);

      // Second check: If not searched yet, but Gemini says it doesn't know
      if (!fallbackSearchUsed && !searchContext) {
        const outStr = JSON.stringify(parsed).toLowerCase();
        if (outStr.includes("i don't have information") || outStr.includes("i am not aware") || outStr.includes("cannot verify") || outStr.includes("i do not have")) {
          console.info("Gemini lacks info. Fetching live data...");
          setLoading('Verifying with live data...');
          const results = await fetchSearchResults(text);
          if (results === null) {
            console.warn("Tavily API failed. Staying with Gemini fallback response.");
          } else if (results.length > 0) {
            usedSources = results.slice(0, 3);
            searchContext = results.slice(0, 3).map((r, i) => `Source ${i + 1}: ${r.title} - ${r.content}`).join('\n\n');
            const secondAttempt = await callGemini(MODELS.primary, apiKey, text, searchContext);
            parsed = secondAttempt.parsed;
          } else {
            setLoading(false);
            setError("Insufficient real-time data");
            return null;
          }
        }
      }

      if (usedSources.length > 0) {
        parsed.sources = usedSources;
      }

      setResult(parsed);
      setModelUsed(MODELS.primary);
      return parsed;
    } catch (primaryErr) {
      console.warn(`Primary model (${MODELS.primary}) failed:`, primaryErr.message);

      // If quota exceeded, auto-fallback to 2.0 flash
      if (isQuotaError(primaryErr.message)) {
        console.info(`Quota exceeded on ${MODELS.primary}, falling back to ${MODELS.fallback}...`);
        try {
          const { parsed } = await callGemini(MODELS.fallback, apiKey, text);
          setResult(parsed);
          setModelUsed(MODELS.fallback);
          return parsed;
        } catch (fallbackErr) {
          console.error(`Fallback model (${MODELS.fallback}) also failed:`, fallbackErr.message);

          if (isQuotaError(fallbackErr.message)) {
            const secs = parseRetrySeconds(fallbackErr.message) || 60;
            startRetryCountdown(secs);
            setError(`Both models are quota-limited. Please retry in ${secs}s or upgrade your Gemini API plan.`);
          } else {
            setError(fallbackErr.message || 'Analysis failed on fallback model.');
          }
          return null;
        }
      }

      // Non-quota error on primary
      const secs = parseRetrySeconds(primaryErr.message);
      if (secs) startRetryCountdown(secs);
      setError(primaryErr.message || 'Analysis failed. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [startRetryCountdown]);

  // Analyze directly from URL: Fast strategy fetching text proxy first, then regular analyze
  const analyzeUrl = useCallback(async (articleUrl) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_key_here') {
      setError('Please set your VITE_GEMINI_API_KEY in the .env file.');
      return null;
    }

    setLoading('Extracting article text...');
    setError(null);
    setResult(null);
    setModelUsed(null);
    setRetryIn(null);

    try {
      const { fetchArticleFromUrl } = await import('../utils/fetchArticle.js');
      const { text, title, error: fetchErr } = await fetchArticleFromUrl(articleUrl);
      
      if (fetchErr || !text) {
        setError(fetchErr || 'Failed to extract text from URL.');
        setLoading(false);
        return null;
      }
      
      // Route into the normal analysis flow which parses claims and fetches external sources
      const res = await analyze(text);
      if (res) {
        return { result: res, articleText: text, pageTitle: title };
      }
      return null;
    } catch (err) {
      setError(err.message || 'URL analysis failed. Please try again.');
      setLoading(false);
      return null;
    }
  }, [analyze]);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setLoading(false);
    setModelUsed(null);
    setRetryIn(null);
    if (retryTimerRef.current) clearInterval(retryTimerRef.current);
  }, []);

  return { analyze, analyzeUrl, loading, error, result, reset, modelUsed, retryIn };
}
