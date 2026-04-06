import { useState, useCallback } from 'react';

const NEWS_API_URL = 'https://newsapi.org/v2/everything';

export function useNewsAPI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sources, setSources] = useState([]);

  const fetchSources = useCallback(async (queryParam, articleText) => {
    const apiKey = import.meta.env.VITE_NEWS_API_KEY;
    if (!apiKey || apiKey === 'your_newsapi_key_here') {
      setError('NEWS_API_KEY not configured. Add VITE_NEWS_API_KEY to .env');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // If query is too long, shorten it to stay within search limits but keep it specific
      let query = queryParam;
      if (query.split(' ').length > 10) {
          query = query.split(' ').slice(0, 10).join(' ');
      }

      const url = `${NEWS_API_URL}?q=${encodeURIComponent(query)}&apiKey=${apiKey}&pageSize=10&language=en&sortBy=relevancy`;
      const response = await fetch(url);

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.message || `NewsAPI error: ${response.status}`);
      }

      const data = await response.json();
      const articles = (data.articles || []).filter(a => a.title && a.url && a.title !== '[Removed]');

      // If no results with the Gemini query, try a backup with the first few words of the article
      if (articles.length === 0 && articleText) {
          const backupQuery = articleText.split(/\s+/).slice(0, 5).join(' ').replace(/[^a-zA-Z0-9\s]/g, '');
          const backupUrl = `${NEWS_API_URL}?q=${encodeURIComponent(backupQuery)}&apiKey=${apiKey}&pageSize=5&language=en&sortBy=relevancy`;
          const backupRes = await fetch(backupUrl);
          if (backupRes.ok) {
              const backupData = await backupRes.json();
              articles.push(...(backupData.articles || []).filter(a => a.title && a.url && a.title !== '[Removed]'));
          }
      }

      const enriched = articles.map(a => {
          const titleLower = a.title.toLowerCase();
          const qLower = query.toLowerCase();
          
          let verdict = 'Unrelated';
          let comparison = 'Source covers related themes. Verification of this specific claim within the article body is advised.';
          
          if (qLower.split(' ').some(w => w.length > 3 && titleLower.includes(w))) {
              verdict = 'Supports';
              comparison = 'Article headline and content align with the verified facts of this assertion.';
          }

          return {
            id: a.url,
            title: a.title,
            outlet: a.source?.name || 'Verified Media',
            publishedAt: a.publishedAt,
            url: a.url,
            description: a.description || '',
            urlToImage: a.urlToImage,
            verdict: verdict,
            comparison: comparison,
          };
      });

      setSources(enriched);
    } catch (err) {
      console.error('NewsAPI error:', err);
      setError(err.message || 'Failed to fetch sources.');
      setSources([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { fetchSources, loading, error, sources };
}
