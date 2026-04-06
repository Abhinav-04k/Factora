import { useState, useEffect } from 'react';
import {
  Search, Sun, Moon, Share2, Copy, Check, AlertCircle,
  Microscope, FileText, Newspaper, ChevronRight, Sparkles, X,
  Link as LinkIcon, AlignLeft
} from 'lucide-react';
import { useGeminiAnalysis } from './hooks/useGeminiAnalysis';
import AnalysisTab from './components/AnalysisTab';
import ArticleViewTab from './components/ArticleViewTab';
import SourcesTab from './components/SourcesTab';
import ChatBot from './components/ChatBot';
import UrlInputSection from './components/UrlInputSection';
import { encodeShareableReport, decodeShareableReport, formatResultAsText } from './utils/shareReport';

// Tab definitions
const TABS = [
  { id: 'analysis', label: 'Analysis', icon: Microscope },
  { id: 'article', label: 'Article View', icon: FileText },
  { id: 'sources', label: 'Sources', icon: Newspaper },
];

// Logo SVG component
function Logo() {
  return (
    <div className="flex items-center gap-3 group cursor-pointer transition-transform hover:scale-105">
      <div className="relative w-9 h-9">
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
          <defs>
            <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" className="stop-navy-900 dark:stop-gold-300" />
              <stop offset="100%" className="stop-navy-700 dark:stop-gold-600" />
            </linearGradient>
            {/* Standard colors for gradients in SVG need to be real hex or class-based if supported */}
            <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#D4AF37" />
              <stop offset="100%" stopColor="#943b0a" />
            </linearGradient>
          </defs>
          <circle cx="16" cy="16" r="14" stroke="url(#goldGrad)" strokeWidth="2.5" fill="none" className="opacity-20" />
          <path d="M16 8 L16 24 M8 16 L24 16" stroke="url(#goldGrad)" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="16" cy="16" r="6" fill="url(#goldGrad)" />
        </svg>
      </div>
      <div>
        <span className="text-2xl font-black tracking-tighter text-navy-900 dark:text-white transition-colors">
          FACT<span className="text-gold">ORA</span>
        </span>
      </div>
    </div>
  );
}

// Loading overlay
function LoadingOverlay({ message }) {
  const steps = [
    'Parsing article structure...',
    'Detecting emotional language...',
    'Evaluating source citations...',
    'Scoring credibility signals...',
    'Generating analysis report...',
  ];
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep(s => Math.min(s + 1, steps.length - 1));
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-card p-12 text-center space-y-8 animate-fade-in max-w-xl mx-auto border-t-4 border-t-gold">
      {/* Pulsing icon */}
      <div className="relative mx-auto w-24 h-24">
        <div className="absolute inset-0 rounded-full bg-gold/10 animate-ping" />
        <div className="absolute inset-4 rounded-full bg-navy-950 dark:bg-gold flex items-center justify-center shadow-2xl">
          <Sparkles size={28} className="text-gold dark:text-navy-950 animate-pulse" />
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-2xl font-black text-navy-900 dark:text-white">{message || 'Neural Analysis'}</h3>
        <p className="text-navy-400 dark:text-navy-400 font-medium">Scanning misinformation signals with Gemini AI...</p>
      </div>

      {/* Steps */}
      <div className="space-y-4 max-w-sm mx-auto text-left py-4">
        {steps.map((s, i) => (
          <div key={i} className={`flex items-center gap-4 text-sm font-bold transition-all duration-300 ${
            i < step ? 'text-emerald-500' : i === step ? 'text-navy-800 dark:text-white' : 'text-navy-200 dark:text-navy-800'
          }`}>
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs flex-shrink-0 transition-all border-2 ${
              i < step ? 'bg-emerald-50 border-emerald-500 text-emerald-600' :
              i === step ? 'bg-navy-900 dark:bg-gold border-navy-900 dark:border-gold text-white dark:text-navy-950 shadow-lg' :
              'bg-transparent border-navy-100 dark:border-navy-900 text-navy-200 dark:text-navy-900'
            }`}>
              {i < step ? '✓' : i + 1}
            </div>
            {s}
          </div>
        ))}
      </div>
    </div>
  );
}

// Notification toast
function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-8 right-8 z-[100] flex items-center gap-4 px-6 py-4 rounded-[28px] border shadow-2xl animate-slide-up backdrop-blur-xl ${
      type === 'success'
        ? 'bg-emerald-50/90 dark:bg-emerald-950/80 border-emerald-500/20 text-emerald-800 dark:text-emerald-300'
        : 'bg-red-50/90 dark:bg-red-950/80 border-red-500/20 text-red-800 dark:text-red-300'
    }`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
      }`}>
        {type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
      </div>
      <span className="text-sm font-black tracking-tight">{message}</span>
      <button onClick={onClose} className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors ml-2">
        <X size={16} />
      </button>
    </div>
  );
}

const INPUT_MODES = [
  { id: 'text', label: 'Paste Text', icon: AlignLeft },
  { id: 'url', label: 'From URL', icon: LinkIcon },
];

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [inputText, setInputText] = useState('');
  const [inputMode, setInputMode] = useState('text'); // 'text' | 'url'
  const [activeTab, setActiveTab] = useState('analysis');
  const [showChat, setShowChat] = useState(false);
  const [toast, setToast] = useState(null);
  const [articleText, setArticleText] = useState('');
  const [articleSource, setArticleSource] = useState(null); // { title, url } for URL mode

  const { analyze, analyzeUrl, loading, error, result, reset, modelUsed, retryIn } = useGeminiAnalysis();

  // Check for shared report on load
  useEffect(() => {
    const shared = decodeShareableReport();
    if (shared?.article && shared?.analysis) {
      setArticleText(shared.article);
      setInputText(shared.article);
    }
  }, []);

  // Dark mode class on html element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Called when text textarea is submitted
  const handleAnalyze = async () => {
    const text = inputText.trim();
    if (!text) return;
    setArticleText(text);
    setArticleSource(null);
    const res = await analyze(text);
    if (res) setActiveTab('analysis');
  };

  // Called by UrlInputSection — try Gemini url_context first, fall back to Jina fetch+analyze
  const handleUrlArticleReady = async ({ url }) => {
    // Step 1: Try Gemini's built-in url_context (fetches + analyzes in one call)
    const urlResult = await analyzeUrl(url);

    if (urlResult?.result) {
      // url_context succeeded — show results
      setArticleText(urlResult.articleText || url);
      setArticleSource({ title: urlResult.pageTitle || url, url });
      setActiveTab('analysis');
      return;
    }

    // Step 2: Only fall back if url_context is unsupported (not quota/network errors)
    if (urlResult?.needsTextFallback) {
      const { fetchArticleFromUrl } = await import('./utils/fetchArticle.js');
      const { text, title, error: fetchErr } = await fetchArticleFromUrl(url);
      if (fetchErr || !text) {
        // Surface the fetch error to the user
        setToast({ message: fetchErr || 'Failed to fetch article text.', type: 'error' });
        return;
      }
      setArticleText(text);
      setArticleSource({ title: title || url, url });
      const res = await analyze(text);
      if (res) setActiveTab('analysis');
    }
    // If urlResult is null, error was already set inside analyzeUrl — nothing to do
  };

  const handleShare = () => {
    if (!result) return;
    const url = encodeShareableReport(articleText, result);
    if (url) {
      navigator.clipboard.writeText(url).catch(() => {});
      setToast({ message: 'Shareable link copied to clipboard!', type: 'success' });
    } else {
      setToast({ message: 'Failed to generate share link.', type: 'error' });
    }
  };

  const handleCopy = () => {
    if (!result) return;
    const text = formatResultAsText(articleText, result);
    navigator.clipboard.writeText(text).catch(() => {});
    setToast({ message: 'Report copied as plain text!', type: 'success' });
  };

  const handleReset = () => {
    reset();
    setInputText('');
    setArticleText('');
    setArticleSource(null);
    setActiveTab('analysis');
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 ${darkMode ? 'dark bg-navy-950 text-slate-100' : 'bg-slate-50 text-navy-900'}`}>
      <div className="min-h-screen font-sans">
        {/* Animated background gradient */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/4 w-full h-[500px] bg-gold-400/5 dark:bg-gold-500/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-navy-400/5 dark:bg-navy-900/10 rounded-full blur-[100px]" />
        </div>

        {/* Header */}
        <header className="relative z-20 border-b border-navy-100 dark:border-navy-900 bg-white/70 dark:bg-navy-950/80 backdrop-blur-xl transition-all duration-300">
          <div className="max-w-6xl mx-auto px-4 sm:px-8 h-20 flex items-center justify-between">
            <Logo />

            <div className="flex items-center gap-4">
              {result && (
                <div className="hidden lg:flex items-center gap-2 pr-4 border-r border-navy-100 dark:border-navy-800">
                  <button
                    onClick={handleShare}
                    className="btn-secondary py-2"
                    title="Share report"
                    id="share-btn"
                  >
                    <Share2 size={16} />
                    <span>Share</span>
                  </button>
                  <button
                    onClick={handleCopy}
                    className="btn-secondary py-2"
                    title="Copy as text"
                    id="copy-btn"
                  >
                    <Copy size={16} />
                    <span>Copy</span>
                  </button>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                {result && (
                  <button
                    onClick={handleReset}
                    className="p-2.5 rounded-xl bg-navy-50 dark:bg-navy-900 text-navy-600 dark:text-navy-300 hover:bg-navy-100 dark:hover:bg-navy-800 transition-colors"
                    title="New analysis"
                  >
                    <X size={20} />
                  </button>
                )}
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="w-11 h-11 flex items-center justify-center rounded-2xl bg-white dark:bg-navy-900 border border-navy-100 dark:border-navy-800 text-navy-800 dark:text-gold shadow-sm hover:scale-110 active:scale-95 transition-all duration-300"
                  title="Toggle theme"
                  id="dark-mode-toggle"
                >
                  {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

          {/* Hero — show when no result */}
          {!result && !loading && (
            <div className="text-center mb-16 animate-fade-in py-10">
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-gold-100/50 dark:bg-gold/10 border border-gold-200 dark:border-gold/20 text-gold-800 dark:text-gold text-xs font-bold uppercase tracking-widest mb-8 animate-pulse-slow">
                <Sparkles size={14} />
                Gemini 2.5 Flash Powered
              </div>
              <h1 className="text-5xl sm:text-7xl font-black text-navy-900 dark:text-white mb-6 leading-[1.1] tracking-tight">
                Detect Misinformation<br />
                <span className="text-gold">with Neural Precision</span>
              </h1>
              <p className="text-navy-500 dark:text-navy-300 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed font-medium">
                Our advanced AI engine analyzes linguistic patterns, source credibility, and emotional bias to give you the <span className="text-navy-900 dark:text-white font-bold underline decoration-gold/50 decoration-4 underline-offset-4">truth</span> instantly.
              </p>
            </div>
          )}

          {/* Input section */}
          {!result && !loading && (
            <div className="glass-card p-1 sm:p-2 mb-10 animate-slide-up shadow-2xl">
              <div className="p-6 sm:p-8">
                {/* Input mode toggle */}
                <div className="flex gap-1 p-1 bg-navy-50 dark:bg-navy-950 rounded-2xl w-fit mb-8 border border-navy-100 dark:border-navy-800">
                  {INPUT_MODES.map(mode => {
                    const Icon = mode.icon;
                    return (
                      <button
                        key={mode.id}
                        onClick={() => setInputMode(mode.id)}
                        id={`input-mode-${mode.id}`}
                        className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                          inputMode === mode.id
                            ? 'bg-navy-900 dark:bg-gold text-white dark:text-navy-950 shadow-lg'
                            : 'text-navy-400 dark:text-navy-500 hover:text-navy-600 dark:hover:text-navy-300'
                        }`}
                      >
                        <Icon size={14} />
                        {mode.label}
                      </button>
                    );
                  })}
                </div>

              {/* Text paste mode */}
              {inputMode === 'text' && (
                <>
                  <label htmlFor="article-input" className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                    Article Text
                  </label>
                  <textarea
                    id="article-input"
                    className="input-area scrollbar-thin"
                    rows={8}
                    placeholder={`Paste article text here...\n\nTip: Works best with news articles, blog posts, or opinion pieces.`}
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                  />
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xs text-gray-600">
                      {inputText.length} characters · ~{Math.ceil(inputText.split(/\s+/).length / 200)} min read
                    </span>
                    <button
                      onClick={handleAnalyze}
                      disabled={!inputText.trim() || loading}
                      className="btn-primary"
                      id="analyze-btn"
                    >
                      <Search size={16} />
                      Analyze Article
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </>
              )}

              {/* URL mode */}
              {inputMode === 'url' && (
                <>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                    Article URL
                  </label>
                  <UrlInputSection
                    onArticleReady={handleUrlArticleReady}
                    disabled={loading}
                  />
                </>
              )}
            </div>
          </div>
        )}

          {/* Error state */}
          {error && !loading && (
            <div className="glass-card p-5 mb-6 border border-red-500/20 bg-red-500/5 animate-fade-in">
              <div className="flex items-start gap-3">
                <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
                <div className="w-full">
                  <p className="text-sm font-semibold text-red-400 mb-1">Analysis Failed</p>
                  <p className="text-sm text-gray-400">{error}</p>
                  {retryIn && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-amber-400">
                      <span className="w-5 h-5 rounded-full border-2 border-amber-400/50 border-t-amber-400 spinner inline-block" />
                      Quota resets in <span className="font-bold tabular-nums">{retryIn}s</span> — then you can retry.
                    </div>
                  )}
                  <div className="flex gap-2 mt-3">
                    <button onClick={handleReset} disabled={!!retryIn} className="btn-secondary text-xs disabled:opacity-50">
                      {retryIn ? `Wait ${retryIn}s…` : 'Try Again'}
                    </button>
                    <a
                      href="https://aistudio.google.com/plan"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary text-xs"
                    >
                      Upgrade Plan ↗
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="animate-fade-in">
              <LoadingOverlay message={typeof loading === 'string' ? loading : undefined} />
            </div>
          )}

          {/* Results */}
          {result && !loading && (
            <div className="animate-slide-up">
              {/* Input preview */}
              <div className="glass-card p-4 mb-5 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-[10px] font-black text-navy-400 dark:text-navy-500 uppercase tracking-[2px]">Analyzed article</span>
                    {modelUsed && (
                      <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest ${
                        modelUsed === 'gemini-2.5-flash'
                          ? 'bg-gold/10 text-gold-600 dark:text-gold border border-gold/20'
                          : 'bg-navy-900 text-white dark:bg-gold dark:text-navy-950 shadow-sm'
                      }`}>
                        {modelUsed === 'gemini-2.5-flash' ? '✦ 2.5 Flash' : '⚡ 2.0 Flash'}
                      </span>
                    )}
                    {articleSource?.url && (
                      <a
                        href={articleSource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-black px-3 py-1 rounded-full bg-navy-50 dark:bg-navy-900/50 text-navy-400 dark:text-navy-500 hover:text-gold transition-colors border border-navy-100 dark:border-navy-800 flex items-center gap-2 uppercase tracking-widest"
                      >
                        <LinkIcon size={12} />
                        {new URL(articleSource.url).hostname}
                      </a>
                    )}
                  </div>
                  {articleSource?.title && (
                    <p className="text-sm font-medium text-gray-200 truncate mb-0.5">{articleSource.title.slice(0, 90)}{articleSource.title.length > 90 ? '…' : ''}</p>
                  )}
                  <p className="text-sm text-gray-500 truncate">{articleText.slice(0, 100)}{articleText.length > 100 ? '...' : ''}</p>
                </div>
                <button onClick={handleReset} className="btn-secondary text-xs flex-shrink-0" id="reset-btn">
                  <X size={12} />
                  New
                </button>
              </div>

              {/* Tab navigation */}
              <div className="flex gap-2 p-2 glass-card mb-8 w-fit mx-auto sm:mx-0 shadow-lg">
                {TABS.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-[2px] transition-all duration-300 ${
                          activeTab === tab.id 
                          ? 'bg-navy-900 dark:bg-gold text-white dark:text-navy-950 shadow-md' 
                          : 'text-navy-400 dark:text-navy-500 hover:text-navy-900 dark:hover:text-white'
                      }`}
                      id={`tab-${tab.id}`}
                    >
                      <Icon size={16} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Tab content */}
              <div key={activeTab}>
                {activeTab === 'analysis' && <AnalysisTab analysis={result} articleText={articleText} />}
                {activeTab === 'article' && <ArticleViewTab analysis={result} articleText={articleText} />}
                {activeTab === 'sources' && <SourcesTab analysis={result} articleText={articleText} />}
              </div>
            </div>
          )}

          {/* Feature cards — only on home */}
          {!result && !loading && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16 animate-fade-in">
              {[
                {
                  icon: '🎯',
                  title: 'Credibility Score',
                  desc: 'Deep neural analysis provides a 0-100 score with color-coded risk levels.',
                },
                {
                  icon: '✍️',
                  title: 'Semantic Insight',
                  desc: 'Annotated highlights reveal emotional triggers and unsourced claims.',
                },
                {
                  icon: '📰',
                  title: 'Fact Corroboration',
                  desc: 'Real-time cross-referencing against verified news sources.',
                },
              ].map((f, i) => (
                <div key={i} className="glass-card-hover p-8 group">
                  <div className="w-14 h-14 rounded-2xl bg-navy-50 dark:bg-navy-900 flex items-center justify-center text-3xl mb-6 shadow-inner group-hover:scale-110 transition-transform duration-300">
                    {f.icon}
                  </div>
                  <h3 className="text-lg font-black text-navy-900 dark:text-white mb-3 tracking-tight">{f.title}</h3>
                  <p className="text-sm text-navy-400 dark:text-navy-400 leading-relaxed font-medium">{f.desc}</p>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="relative z-20 border-t border-navy-100 dark:border-navy-900 py-12 mt-20 bg-white/50 dark:bg-navy-950/50 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-4 sm:px-8 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex flex-col items-center md:items-start gap-3">
              <Logo />
              <p className="text-[10px] font-black text-navy-400 dark:text-navy-600 uppercase tracking-[4px]">Verified Neural Analysis Engine</p>
            </div>
            <div className="flex flex-col items-center md:items-end gap-2 text-xs font-bold text-navy-500 dark:text-navy-400">
              <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  SYSTEM ONLINE: GemInI-2.5-FLASH
              </div>
              <p className="opacity-50 mt-2">© 2026 FACTORA LABS · NOETIC VERIFICATION SERVICES</p>
            </div>
          </div>
        </footer>

        {/* Floating ChatBot */}
        {result && (
          <div className="fixed bottom-8 right-8 z-[90] flex flex-col items-end gap-4">
            {showChat && (
              <div className="w-[380px] sm:w-[420px] shadow-2xl animate-slide-up-limited">
                <ChatBot 
                  analysis={result} 
                  articleText={articleText} 
                  onClose={() => setShowChat(false)} 
                />
              </div>
            )}
            <button
              onClick={() => setShowChat(!showChat)}
              id="chatbot-toggle"
              className={`w-16 h-16 rounded-[28px] shadow-2xl flex items-center justify-center transition-all duration-500 hover:scale-110 active:scale-95 group ${
                showChat 
                  ? 'bg-navy-900 dark:bg-gold text-white dark:text-navy-950' 
                  : 'bg-gold dark:bg-navy-900 border-4 border-white dark:border-navy-800 text-navy-950 dark:text-gold'
              }`}
            >
              {showChat ? <X size={24} /> : <Sparkles size={24} className="group-hover:rotate-12 transition-transform" />}
              {!showChat && (
                <div className="absolute -top-12 right-0 bg-navy-900 dark:bg-navy-800 text-white text-[10px] font-black px-4 py-2 rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all pointer-events-none uppercase tracking-[2px] shadow-xl">
                    Ask Factora AI
                </div>
              )}
            </button>
          </div>
        )}

        {/* Toast notifications */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </div>
  );
}
