/**
 * Fetches article text from a URL.
 *
 * Strategy (in order):
 *  1. Jina AI Reader (r.jina.ai) — clean markdown, works on most news sites
 *  2. allorigins CORS proxy + HTML text extraction
 *  3. corsproxy.io + HTML text extraction
 */

// ─── Strategy 1: Jina Reader ────────────────────────────────────────────────

async function fetchViaJina(url) {
  const jinaUrl = `https://r.jina.ai/${url}`;
  const response = await fetch(jinaUrl, {
    headers: {
      Accept: 'text/plain, text/markdown, */*',
      'X-Return-Format': 'markdown',
      'X-Timeout': '15',
    },
    signal: AbortSignal.timeout(20000),
  });

  if (!response.ok) throw new Error(`Jina returned HTTP ${response.status}`);

  const text = await response.text();
  if (!text || text.trim().length < 150) throw new Error('Jina returned too-short content');

  // Parse title from first heading or "Title:" metadata line
  let title = url;
  const titleLineMatch = text.match(/^(?:Title:\s*(.+)|#\s+(.+))$/m);
  if (titleLineMatch) {
    title = (titleLineMatch[1] || titleLineMatch[2] || '').trim();
  }

  // Strip Jina header metadata block (URL:, Published Time:, etc.)
  const cleaned = text
    .replace(/^(URL|Title|Published Time|Description|Author|Source URL):.*$/gim, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return { text: cleaned, title };
}

// ─── Strategy 2 & 3: CORS proxy + HTML extraction ───────────────────────────

const CORS_PROXIES = [
  (url) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
];

function extractTextFromHtml(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Remove noise
  const removeSelectors = [
    'script', 'style', 'nav', 'header', 'footer',
    'aside', 'form', 'iframe', 'noscript', 'button',
    '.ad', '.ads', '.advertisement', '.cookie-banner',
    '[aria-hidden="true"]', '.social-share', '.related-articles',
    '.comments', '.sidebar', '.menu', '.navigation',
  ];
  removeSelectors.forEach(sel => {
    doc.querySelectorAll(sel).forEach(el => el.remove());
  });

  // Find main article content
  const articleSelectors = [
    'article', '[role="main"]', 'main',
    '.article-body', '.article-content', '.post-content',
    '.entry-content', '.story-body', '.article__body',
    '#article-body', '.content-body', '.storytext',
  ];

  let contentEl = null;
  for (const sel of articleSelectors) {
    const el = doc.querySelector(sel);
    if (el && (el.innerText || el.textContent)?.trim().length > 200) {
      contentEl = el;
      break;
    }
  }
  if (!contentEl) contentEl = doc.body;

  let text = contentEl?.innerText || contentEl?.textContent || '';
  return text
    .replace(/\t/g, ' ')
    .replace(/ {2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function fetchViaProxy(url) {
  let lastError = null;

  for (const proxyFn of CORS_PROXIES) {
    try {
      const proxyUrl = proxyFn(url);
      const response = await fetch(proxyUrl, { signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json().catch(() => null);
      const html = data?.contents ?? (typeof data === 'string' ? data : null);
      if (!html || html.length < 200) throw new Error('Empty or too-short response');

      const text = extractTextFromHtml(html);
      if (text.length < 150) throw new Error('Could not extract meaningful text');

      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : url;

      return { text, title };
    } catch (err) {
      lastError = err;
      console.warn(`[fetchArticle] Proxy failed (${proxyFn(url)}):`, err.message);
    }
  }

  throw lastError || new Error('All proxies failed');
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Fetch article content from a URL.
 * Returns { text, title, error, method }
 */
export async function fetchArticleFromUrl(url) {
  // 1. Try Jina Reader (best for news sites, returns clean text)
  try {
    console.info('[fetchArticle] Trying Jina Reader...');
    const { text, title } = await fetchViaJina(url);
    console.info('[fetchArticle] ✓ Jina Reader succeeded');
    return { text, title, error: null, method: 'jina' };
  } catch (jinaErr) {
    console.warn('[fetchArticle] Jina Reader failed:', jinaErr.message);
  }

  // 2. Fall back to CORS proxies + HTML extraction
  try {
    console.info('[fetchArticle] Trying CORS proxies...');
    const { text, title } = await fetchViaProxy(url);
    console.info('[fetchArticle] ✓ CORS proxy succeeded');
    return { text, title, error: null, method: 'proxy' };
  } catch (proxyErr) {
    console.warn('[fetchArticle] All CORS proxies failed:', proxyErr.message);
    return {
      text: null,
      title: null,
      method: null,
      error:
        'Could not fetch the article. The site may require a login or block automated access. ' +
        'Try copying the article text and pasting it in the "Paste Text" tab instead.',
    };
  }
}

/**
 * Use Gemini's url_context tool to BOTH fetch AND analyze a URL in one call.
 * Returns the raw Gemini analysis JSON (same schema as regular analyze).
 */
export async function analyzeUrlWithGemini(url, apiKey, systemPrompt, models) {
  const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

  async function callWithUrlContext(model) {
    const endpoint = `${BASE_URL}/${model}:generateContent?key=${apiKey}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{
          role: 'user',
          parts: [{ text: `Fetch and analyze the article at this URL for misinformation:\n\n${url}` }],
        }],
        tools: [{ url_context: {} }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
          maxOutputTokens: 4096,
        },
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) throw new Error('Empty response from Gemini API');

    // Collect page title from url_context_metadata if available
    const urlMeta = data?.candidates?.[0]?.urlContextMetadata?.urlMetadata;
    const pageTitle = urlMeta?.[0]?.title || null;

    try {
      return { parsed: JSON.parse(rawText), pageTitle };
    } catch {
      const cleaned = rawText.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
      return { parsed: JSON.parse(cleaned), pageTitle };
    }
  }

  // Try primary model, fall back to secondary
  for (const model of models) {
    try {
      const result = await callWithUrlContext(model);
      return { ...result, modelUsed: model, error: null };
    } catch (err) {
      console.warn(`[analyzeUrlWithGemini] Model ${model} failed:`, err.message);
      if (model === models[models.length - 1]) {
        return { parsed: null, pageTitle: null, modelUsed: null, error: err.message };
      }
    }
  }
}

export function isValidUrl(str) {
  try {
    const u = new URL(str.trim());
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}
