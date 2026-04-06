export async function fetchSearchResults(query) {
  const apiKey = import.meta.env.VITE_TAVILY_API_KEY;
  if (!apiKey) {
    console.warn("Tavily API key not found. Skipping search.");
    return null;
  }

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        query: query,
        max_results: 3
      })
    });

    if (!response.ok) {
      console.error("Tavily search failed:", response.status);
      return null;
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error("Tavily API error:", error);
    return null;
  }
}
