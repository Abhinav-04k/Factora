import { useState, useRef } from 'react';
import { Link, Loader2, AlertCircle, CheckCircle2, Globe, ArrowRight, X } from 'lucide-react';
import { isValidUrl } from '../utils/fetchArticle';

const EXAMPLE_URLS = [
  'https://www.bbc.com/news',
  'https://apnews.com',
  'https://reuters.com',
];

export default function UrlInputSection({ onArticleReady, disabled }) {
  const [url, setUrl] = useState('');
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [fetchedTitle, setFetchedTitle] = useState(null);
  const [fetchStep, setFetchStep] = useState('');
  const inputRef = useRef(null);

  const urlValid = isValidUrl(url);

  const handleFetch = async () => {
    if (!urlValid || fetching) return;
    setFetching(true);
    setFetchError(null);
    setFetchedTitle(null);
    setFetchStep('Preparing to analyze URL...');

    await new Promise(r => setTimeout(r, 300));
    setFetching(false);
    setFetchStep('');

    // Hand off to parent — Gemini url_context will do the actual fetch + analysis
    onArticleReady({ url: url.trim() });
  };

  const handleClear = () => {
    setUrl('');
    setFetchError(null);
    setFetchedTitle(null);
    setFetchStep('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && urlValid && !fetching) handleFetch();
  };

  return (
    <div className="space-y-6">
      {/* URL Input Row */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 group">
          {/* Globe icon */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-navy-400 group-focus-within:text-gold transition-colors pointer-events-none">
            <Globe size={18} />
          </div>

          <input
            ref={inputRef}
            id="url-input"
            type="url"
            value={url}
            onChange={e => { setUrl(e.target.value); setFetchError(null); setFetchedTitle(null); }}
            onKeyDown={handleKeyDown}
            placeholder="https://example.com/news-article"
            disabled={fetching || disabled}
            className={`w-full pl-12 pr-12 py-4 rounded-[20px] border-2 text-base font-medium
              bg-white dark:bg-navy-950 text-navy-900 dark:text-white placeholder-navy-300 dark:placeholder-navy-700
              outline-none transition-all duration-300 shadow-sm
              ${urlValid && url ? 'border-gold/50 ring-4 ring-gold/5' : 'border-navy-100 dark:border-navy-900'}
              ${fetchError ? 'border-red-500/40 ring-4 ring-red-500/5' : ''}
              focus:border-gold focus:ring-4 focus:ring-gold/10
              disabled:opacity-50 disabled:cursor-not-allowed`}
          />

          {/* Clear button */}
          {url && !fetching && (
            <button
              onClick={handleClear}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-navy-50 dark:bg-navy-900 text-navy-400 hover:text-navy-900 dark:hover:text-white flex items-center justify-center transition-all"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Fetch / Analyze button */}
        <button
          onClick={handleFetch}
          disabled={!urlValid || fetching || disabled}
          id="url-fetch-btn"
          className="btn-primary py-4 px-8 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 shadow-gold/20"
        >
          {fetching ? (
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span>ANALYZING...</span>
            </div>
          ) : (
            <>
              <span className="font-black tracking-widest">VERIFY URL</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </div>

      {/* Status messages */}
      {fetching && fetchStep && (
        <div className="flex items-center gap-3 text-xs font-black text-gold uppercase tracking-[3px] animate-pulse-slow">
          <Loader2 size={14} className="animate-spin" />
          <span>{fetchStep}</span>
        </div>
      )}

      {fetchError && (
        <div className="flex items-start gap-4 p-6 rounded-[28px] bg-red-50 dark:bg-red-950/20 border border-red-500/20 animate-fade-in shadow-xl shadow-red-500/5">
          <div className="w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center flex-shrink-0 text-red-500">
             <AlertCircle size={20} />
          </div>
          <div>
            <p className="font-black text-navy-900 dark:text-white uppercase tracking-wider mb-1">Source Unreachable</p>
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">{fetchError}</p>
            <p className="text-xs text-navy-400 dark:text-navy-500 mt-3 font-bold uppercase tracking-widest leading-relaxed">
              SUGGESTION: Copy article text manually into the PRIMARY COMPARTMENT.
            </p>
          </div>
        </div>
      )}

      {fetchedTitle && !fetching && (
        <div className="flex items-center gap-3 text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest animate-fade-in">
          <CheckCircle2 size={16} />
          <span>IDENTIFIED: <span className="underline decoration-2 underline-offset-4">{fetchedTitle.slice(0, 70)}{fetchedTitle.length > 70 ? '…' : ''}</span></span>
        </div>
      )}

      {/* URL validation hint */}
      {url && !urlValid && (
        <p className="text-[10px] font-black text-gold uppercase tracking-[3px] flex items-center gap-2 animate-fade-in">
          <AlertCircle size={14} />
          MALFORMED PROTOCOL: ENSURE URL PREFIX (HTTP/HTTPS)
        </p>
      )}

      {/* Example URLs hint */}
      {!url && (
        <div className="flex flex-wrap items-center gap-3 text-[10px] font-black text-navy-400 dark:text-navy-500 uppercase tracking-[2px]">
          <span>VERIFICATION EXAMPLES:</span>
          {EXAMPLE_URLS.map(u => (
            <button
              key={u}
              onClick={() => setUrl(u)}
              className="px-3 py-1 rounded-full border border-navy-100 dark:border-navy-900 hover:border-gold hover:text-gold transition-all"
            >
              {new URL(u).hostname}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
