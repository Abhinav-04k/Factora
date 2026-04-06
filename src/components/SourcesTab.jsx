import { useState, useEffect, useRef } from 'react';
import { ExternalLink, Calendar, AlertCircle, Newspaper, Search } from 'lucide-react';
import { useNewsAPI } from '../hooks/useNewsAPI';

const VERDICT_STYLES = {
  Supports: 'badge-green',
  Contradicts: 'badge-red',
  Unrelated: 'badge-navy',
};

const VERDICT_ICONS = {
  Supports: '✓',
  Contradicts: '✗',
  Unrelated: '~',
};

function SourceCard({ source }) {
  const verdict = source.verdict || 'Unrelated';
  const formattedDate = source.publishedAt
    ? new Date(source.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : 'Unknown date';

  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="glass-card-hover p-6 block group relative overflow-hidden"
      id={`source-${source.id?.split('/').pop()?.replace(/[^a-z0-9]/gi, '-').slice(0, 20)}`}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-navy-50 dark:bg-navy-900 border border-navy-100 dark:border-navy-800 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            <Newspaper size={18} className="text-navy-400 group-hover:text-gold transition-colors" />
          </div>
          <div className="min-w-0">
              <span className="text-[10px] font-black text-navy-400 dark:text-navy-500 uppercase tracking-[2px] block">Media Outlet</span>
              <span className="text-sm font-black text-navy-900 dark:text-white truncate block">{source.outlet}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className={`${VERDICT_STYLES[verdict]} px-3 py-1.5 shadow-sm`}>
            {VERDICT_ICONS[verdict]} {verdict.toUpperCase()}
          </span>
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-navy-50 dark:bg-navy-900 text-navy-400 group-hover:text-gold group-hover:bg-navy-950 transition-all">
            <ExternalLink size={14} />
          </div>
        </div>
      </div>

      <h4 className="text-lg font-black text-navy-900 dark:text-white leading-tight mb-4 group-hover:text-gold transition-colors line-clamp-2 font-serif">
        "{source.title}"
      </h4>

      {source.comparison && (
        <div className="bg-navy-50/50 dark:bg-navy-950/50 p-4 rounded-2xl border border-navy-100 dark:border-navy-800/50 mb-4">
            <p className="text-[13px] text-navy-600 dark:text-navy-400 leading-relaxed font-medium">
                {source.comparison}
            </p>
        </div>
      )}

      <div className="flex items-center gap-2 text-[10px] font-black text-navy-300 dark:text-navy-600 uppercase tracking-widest pt-2">
        <Calendar size={12} />
        <span>Published: {formattedDate}</span>
      </div>
    </a>
  );
}

function EmptyState({ message }) {
  return (
    <div className="glass-card p-12 text-center border-dashed border-2">
      <div className="w-16 h-16 rounded-[28px] bg-navy-50 dark:bg-navy-900 flex items-center justify-center mx-auto mb-6">
        <Newspaper size={32} className="text-navy-200 dark:text-navy-800" />
      </div>
      <p className="text-lg font-bold text-navy-400 dark:text-navy-600">{message}</p>
    </div>
  );
}

export default function SourcesTab({ analysis, articleText }) {
  const { fetchSources, loading, error, sources } = useNewsAPI();
  const [fetched, setFetched] = useState(false);

  // Get the optimal search query from Gemini analysis or fallback
  const topClaim = analysis?.searchQuery || analysis?.claims?.[0]?.text || articleText?.slice(0, 100) || '';

  const handleFetchSources = async () => {
    if (fetched || loading) return;
    setFetched(true);
    await fetchSources(topClaim, articleText);
  };

  useEffect(() => {
     handleFetchSources();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in py-4">
      {/* Header */}
      <div className="glass-card p-10 border-b-4 border-b-gold">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
            <div>
                <h3 className="text-2xl font-black text-navy-900 dark:text-white tracking-tight uppercase">Corroborated Intelligence</h3>
                <p className="text-sm text-navy-400 dark:text-navy-500 font-medium">Cross-referencing global media archives via NewsAPI</p>
            </div>
            {!fetched && (
                <button
                    onClick={handleFetchSources}
                    className="btn-primary"
                    disabled={loading}
                    id="fetch-sources-btn"
                >
                    {loading ? (
                    <>
                        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Scanning...
                    </>
                    ) : (
                    <>
                        <Search size={18} />
                        Fetch Sources
                    </>
                    )}
                </button>
            )}
        </div>

        {/* Query preview */}
        {topClaim && (
          <div className="rounded-3xl bg-navy-50 dark:bg-navy-950 p-6 border border-navy-100 dark:border-navy-800 shadow-inner group">
            <span className="text-[10px] font-black text-navy-400 dark:text-navy-500 mb-3 block uppercase tracking-[3px]">Neural Search Parameter:</span>
            <span className="text-lg font-bold text-navy-700 dark:text-navy-200 line-clamp-2 font-serif">"{topClaim}"</span>
          </div>
        )}
      </div>

      {/* Loading state */}
      {loading && fetched && (
        <div className="grid gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass-card p-8 animate-pulse shadow-sm">
              <div className="flex gap-4 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-navy-50 dark:bg-navy-900" />
                <div className="space-y-2 flex-1">
                    <div className="h-3 bg-navy-50 dark:bg-navy-900 rounded-full w-24" />
                    <div className="h-4 bg-navy-50 dark:bg-navy-900 rounded-full w-3/4" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-4 bg-navy-50 dark:bg-navy-900 rounded-full w-full" />
                <div className="h-4 bg-navy-50 dark:bg-navy-900 rounded-full w-2/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="glass-card p-8 border-l-4 border-l-red-500 bg-red-50 dark:bg-red-950/10">
          <div className="flex items-center gap-4 text-red-600 dark:text-red-400 mb-4">
            <AlertCircle size={24} />
            <p className="text-lg font-black tracking-tight">{error}</p>
          </div>
          <div className="bg-white dark:bg-navy-950 p-6 rounded-2xl border border-red-100 dark:border-navy-800">
             <p className="text-sm text-navy-500 dark:text-navy-400 leading-relaxed">
                Connect to <span className="font-black text-navy-900 dark:text-white">NewsAPI Cloud</span> to enable real-time verification. 
                Configure <code className="text-red-500 font-bold px-1.5 py-0.5 bg-red-50 dark:bg-red-900/20 rounded">VITE_NEWS_API_KEY</code> in environment settings.
             </p>
          </div>
        </div>
      )}

      {/* Sources list */}
      {!loading && fetched && !error && sources.length === 0 && (!analysis.sources || analysis.sources.length === 0) && (
        <EmptyState message="Neural scan returned zero corroborated matches." />
      )}

      {/* Merged Live sources if any */}
      {!loading && analysis.sources?.length > 0 && (
        <div className="space-y-6">
           <div className="flex items-center justify-between px-2">
             <span className="text-[10px] font-black text-navy-400 dark:text-navy-500 uppercase tracking-[4px]">Verified Evidence Sources</span>
           </div>
           <div className="grid gap-6">
             {analysis.sources.map((src, i) => (
               <SourceCard key={`live-${i}`} source={{
                  id: src.url,
                  title: src.title,
                  outlet: 'Live Verification Source',
                  url: src.url,
                  verdict: 'Supports',
                  comparison: src.content
               }} />
             ))}
           </div>
        </div>
      )}

      {!loading && sources.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2 pt-4">
            <span className="text-[10px] font-black text-navy-400 dark:text-navy-500 uppercase tracking-[4px]">{sources.length} RECENT CORROBORATED RECORDS</span>
            <div className="flex gap-4">
              <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" /> SUPPORTS
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black text-red-600 uppercase tracking-widest">
                  <div className="w-2 h-2 rounded-full bg-red-500" /> CONTRADICTS
              </div>
            </div>
          </div>
          <div className="grid gap-6">
            {sources.map((source) => (
                <SourceCard key={source.id} source={source} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
