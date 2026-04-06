import { randomUUID } from 'crypto';

const apiKey = process.env.VITE_GEMINI_API_KEY || 'your_key';
const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + apiKey;

const SYSTEM_PROMPT = `You are a misinformation detection engine. Analyze the given article and return ONLY a valid JSON object. No markdown, no preamble, no text outside the JSON.

IMPORTANT: Keep "annotatedText" concise — maximum 3000 characters. If the article is longer, annotate only the most important sections.

Return this exact structure:
{
  "credibilityScore": <number 0-100>,
  "biasDirection": "<Left-leaning | Right-leaning | Corporate | Sensationalist | Neutral>",
  ...
}`;

async function test() {
  const articleUrl = 'https://www.bbc.com/news/articles/cwygqvvdvn0o';
  console.log('Sending URL:', articleUrl);

  const req = {
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
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req)
  });

  const body = await res.json();
  console.log('Response:', JSON.stringify(body, null, 2));
}

test();
