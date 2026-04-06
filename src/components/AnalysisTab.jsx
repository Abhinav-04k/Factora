import { useState } from 'react';
import { MessageSquareWarning, Search, Zap, Compass, BookOpen, Gauge, AlertTriangle, X, CheckCircle2, ExternalLink } from 'lucide-react';
import ScoreGauge from './ScoreGauge';
import SignalCard from './SignalCard';
import MissingContext from './MissingContext';

function ReportModal({ isOpen, onClose, onContinue, copied, articleText }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-md animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-navy-900 w-full max-w-lg overflow-hidden rounded-[40px] border border-red-500/20 animate-slide-up shadow-2xl shadow-red-500/10" onClick={e => e.stopPropagation()}>
        <div className="p-8 border-b dark:border-navy-800 flex items-center justify-between bg-red-50/50 dark:bg-red-500/5">
          <div className="flex items-center gap-4 text-red-600 dark:text-red-400">
            <div className="w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center">
                <AlertTriangle strokeWidth={3} size={22} />
            </div>
            <h2 className="text-2xl font-black tracking-tight">Report Content</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white dark:hover:bg-navy-800 text-navy-400 hover:text-navy-900 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-10 space-y-8">
          <p className="text-lg font-bold text-navy-900 dark:text-white leading-tight">
            You are reporting this as <span className="text-red-500 underline decoration-2 underline-offset-4">fake news</span> or <span className="text-red-500 underline decoration-2 underline-offset-4">misinformation</span>.
          </p>

          <div className="bg-navy-50 dark:bg-navy-950/50 p-6 rounded-[28px] border border-navy-100 dark:border-navy-800 space-y-4">
            <h3 className="text-[11px] font-black text-navy-400 dark:text-navy-500 uppercase tracking-[3px]">Submission Protocol:</h3>
            <ol className="text-sm text-navy-700 dark:text-navy-300 space-y-3 font-bold">
              <li className="flex gap-4 items-center">
                  <span className="w-6 h-6 rounded-lg bg-white dark:bg-navy-900 text-red-500 flex items-center justify-center text-xs shadow-sm">1</span>
                  You will be redirected to the official cyber portal
              </li>
              <li className="flex gap-4 items-center">
                  <span className="w-6 h-6 rounded-lg bg-white dark:bg-navy-900 text-red-500 flex items-center justify-center text-xs shadow-sm">2</span>
                  Paste the copied content into the complaint form
              </li>
              <li className="flex gap-4 items-center">
                  <span className="w-6 h-6 rounded-lg bg-white dark:bg-navy-900 text-red-500 flex items-center justify-center text-xs shadow-sm">3</span>
                  Complete the verification & submit
              </li>
            </ol>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-navy-400 dark:text-navy-500 uppercase tracking-[3px]">Content Capture</span>
              {copied && (
                <span className="flex items-center gap-2 text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-100 dark:border-emerald-500/20 animate-fade-in shadow-sm">
                  <CheckCircle2 size={14} /> COPIED SUCCESSFULLY
                </span>
              )}
            </div>
            <div className="bg-navy-50 dark:bg-navy-950 p-5 rounded-2xl border border-navy-100 dark:border-navy-800 text-sm italic font-serif text-navy-400 dark:text-navy-600 max-h-32 overflow-y-auto scrollbar-thin leading-relaxed">
              {articleText || "No content available."}
            </div>
          </div>
        </div>

        <div className="p-8 border-t dark:border-navy-800 bg-navy-50/30 dark:bg-navy-800/20 flex items-center justify-end gap-4">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-2xl text-sm font-black text-navy-500 dark:text-navy-400 hover:text-navy-900 dark:hover:text-white transition-colors"
          >
            DISMISS
          </button>
          <button
            onClick={onContinue}
            className="flex items-center gap-3 px-8 py-3.5 rounded-2xl text-sm font-black bg-navy-900 dark:bg-red-600 text-white dark:text-white shadow-xl shadow-navy-100 dark:shadow-red-900/10 hover:scale-105 active:scale-95 transition-all"
          >
            GO TO PORTAL
            <ExternalLink size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function ToneMeter({ tone }) {
  const toneMap = {
    'Fear-inducing': { color: 'text-red-500 dark:text-red-400', pct: 15, label: 'Fear-inducing', icon: '😱' },
    'Persuasive': { color: 'text-gold-600 dark:text-gold-400', pct: 50, label: 'Persuasive', icon: '💬' },
    'Neutral': { color: 'text-emerald-600 dark:text-emerald-400', pct: 85, label: 'Neutral', icon: '⚖️' },
  };
  const info = toneMap[tone] || toneMap['Neutral'];

  return (
    <div className="glass-card-hover p-6 group">
      <div className="flex items-center gap-2 mb-6">
        <Gauge size={16} className="text-navy-400" />
        <span className="text-[10px] font-black text-navy-400 dark:text-navy-500 uppercase tracking-[3px]">Acoustic Tone</span>
      </div>

      <div className="flex items-end justify-between mb-4">
        <div className={`text-2xl font-black flex items-center gap-3 ${info.color}`}>
          <span className="text-3xl">{info.icon}</span>
          {info.label.toUpperCase()}
        </div>
      </div>

      {/* Track */}
      <div className="relative h-4 mt-6">
        <div className="absolute inset-0 rounded-full bg-navy-100 dark:bg-navy-900 opacity-60" />
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-500 via-gold to-emerald-500 opacity-20" />
        {/* Thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-8 h-8 bg-white dark:bg-navy-900 rounded-2xl border-4 border-navy-100 dark:border-navy-800 shadow-xl transition-all duration-1000 ease-out z-10 flex items-center justify-center font-black text-[12px] text-navy-900 dark:text-gold"
          style={{ left: `calc(${info.pct}% - 16px)` }}
        >
            {info.icon}
        </div>
      </div>
      <div className="flex justify-between text-[10px] font-black text-navy-300 dark:text-navy-600 uppercase tracking-widest mt-4">
        <span>Emotional</span>
        <span>Balanced</span>
      </div>
    </div>
  );
}

function ReadingLevel({ level }) {
  const levels = ['Simple', 'Moderate', 'Complex'];
  const isActive = (l) => l === level;

  return (
    <div className="glass-card-hover p-6">
      <div className="flex items-center gap-2 mb-6">
        <BookOpen size={16} className="text-navy-400" />
        <span className="text-[10px] font-black text-navy-400 dark:text-navy-500 uppercase tracking-[3px]">Complexity Index</span>
      </div>

      <div className="flex gap-3 bg-navy-50 dark:bg-navy-950 p-2 rounded-[22px] border border-navy-100 dark:border-navy-800">
        {levels.map(l => (
          <div
            key={l}
            className={`flex-1 py-3 group relative rounded-2xl text-center text-[10px] font-black uppercase tracking-widest transition-all duration-500
              ${isActive(l) ? 'text-navy-900 dark:text-navy-950' : 'text-navy-300 dark:text-navy-700 hover:text-navy-500 dark:hover:text-navy-500'}`}
          >
            {isActive(l) && (
              <div className="absolute inset-0 rounded-2xl bg-gold dark:bg-gold shadow-lg shadow-gold/20 animate-fade-in" />
            )}
            <span className="relative z-10">{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}


function ClaimsSection({ claims = [] }) {
  if (!claims.length) return null;

  const confidenceProps = {
    'Verified': { color: 'badge-green', icon: '✓', textStyle: 'text-emerald-700 dark:text-emerald-400' },
    'Unverified': { color: 'badge-yellow', icon: '?', textStyle: 'text-gold-700 dark:text-gold-400' },
    'Contradicted': { color: 'badge-red', icon: '✗', textStyle: 'text-red-700 dark:text-red-400' },
  };

  return (
    <div className="glass-card p-8 sm:p-10 border-t-8 border-gold-400 dark:border-gold mt-12 bg-white dark:bg-navy-900/50 shadow-2xl">
      <div className="flex items-start justify-between mb-10">
        <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-3xl bg-gold/10 dark:bg-gold flex items-center justify-center border-4 border-white dark:border-navy-950 shadow-xl overflow-hidden">
                <Search size={24} className="text-gold dark:text-navy-950" />
            </div>
            <div>
                <h3 className="text-2xl font-black text-navy-900 dark:text-white tracking-tight">Claim Intelligence</h3>
                <p className="text-sm text-navy-400 dark:text-navy-500 font-medium">Neural extraction of factual assertions</p>
            </div>
        </div>
        <div className="px-6 py-2.5 rounded-2xl bg-navy-900 text-white dark:bg-gold dark:text-navy-950 text-base font-black flex items-center justify-center shadow-lg">
            {claims.length} ASSERTIONS
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {claims.map((claim, i) => {
          const conf = confidenceProps[claim.confidence] || confidenceProps['Unverified'];
          return (
            <div key={i} className="group p-6 rounded-[32px] bg-navy-50/50 dark:bg-navy-950 border border-navy-100 dark:border-navy-800 hover:border-gold/50 dark:hover:border-gold hover:shadow-2xl hover:shadow-gold/10 transition-all duration-300 relative overflow-hidden">
               <div className={`absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-20 transition-opacity`}>
                   <Search size={100} className="text-navy-950 dark:text-white" />
               </div>
               
               <p className="text-[15px] font-black italic serif text-navy-700 dark:text-navy-100 leading-relaxed mb-6 group-hover:text-navy-950 dark:group-hover:text-white transition-colors">
                  "{claim.text}"
                </p>

                <div className="flex gap-3 flex-wrap pt-6 border-t border-navy-100 dark:border-navy-900">
                  <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${claim.confidence === 'Verified' ? 'bg-emerald-100/50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30' :
                    claim.confidence === 'Contradicted' ? 'bg-red-100/50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/30' :
                      'bg-gold-100/50 text-gold-700 border-gold-200 dark:bg-gold/10 dark:text-gold dark:border-gold/30'
                    }`}>
                    {conf.icon} {claim.confidence}
                  </span>
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-navy-100/50 text-navy-400 dark:bg-navy-900 dark:text-navy-600 border border-navy-200 dark:border-navy-800">
                    SRC: {claim.verifiability}
                  </span>
                </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AnalysisTab({ analysis, articleText }) {
  const [showReportModal, setShowReportModal] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!analysis) return null;

  const handleReportClick = () => {
    setShowReportModal(true);
    setCopied(false);
    if (articleText) {
      navigator.clipboard.writeText(articleText).then(() => {
        setCopied(true);
      });
    }
  };

  const handleContinueReport = () => {
    window.open("https://cybercrime.gov.in/", "_blank");
    setShowReportModal(false);
  };

  const { credibilityScore, biasDirection, tone, readingLevel, signals, missingContext, claims } = analysis;

  const emotionalSeverity = signals?.emotionalLanguageCount > 5 ? 'high' : signals?.emotionalLanguageCount > 2 ? 'medium' : 'neutral';
  const unsourcedSeverity = signals?.unsourcedClaimsCount > 3 ? 'high' : signals?.unsourcedClaimsCount > 1 ? 'medium' : 'neutral';
  const absoluteSeverity = signals?.absoluteStatementsCount > 2 ? 'high' : signals?.absoluteStatementsCount > 0 ? 'low' : 'neutral';
  const biasSeverity = biasDirection === 'Neutral' ? 'neutral' : biasDirection === 'Sensationalist' ? 'high' : 'medium';

  return (
    <div className="space-y-8 animate-fade-in py-6">
      {/* Score + metadata row */}
      {analysis.isLiveSearch ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          <div className="glass-card p-10 flex flex-col items-center justify-center relative overflow-hidden group border-b-4 border-b-gold">
            <div className="absolute top-6 left-6 bg-navy-900 dark:bg-gold text-white dark:text-navy-950 text-[10px] font-black px-4 py-2 rounded-2xl flex items-center gap-2 uppercase tracking-[3px] shadow-lg">
              <Zap size={13} className="animate-pulse" /> LIVE STREAM
            </div>
            <ScoreGauge score={credibilityScore} />
            
            <button
              onClick={handleReportClick}
              className="mt-10 flex items-center gap-3 px-8 py-4 bg-white dark:bg-navy-950 text-red-500 border-2 border-red-100 dark:border-red-900/30 rounded-[28px] text-xs font-black uppercase tracking-[3px] transition-all hover:bg-red-50 dark:hover:bg-red-950 duration-300"
            >
              <AlertTriangle size={16} /> REPORT INTEGRITY
            </button>
          </div>
          <div className="glass-card p-10 flex items-center justify-center flex-col text-center border-b-4 border-b-navy-200">
             <div className="w-20 h-20 rounded-[30px] bg-navy-50 dark:bg-navy-950 border border-navy-100 dark:border-navy-900 flex items-center justify-center mb-6 shadow-inner">
                <CheckCircle2 size={32} className={`${analysis.label === 'TRUE' ? 'text-emerald-500' : analysis.label === 'FALSE' ? 'text-red-500' : 'text-gold'}`} />
             </div>
            <h3 className="text-[10px] font-black text-navy-400 dark:text-navy-500 uppercase tracking-[4px] mb-2">Neural Verdict</h3>
            <span className={`text-6xl font-black italic tracking-tighter ${analysis.label === 'TRUE' ? 'text-emerald-600 dark:text-emerald-400' :
              analysis.label === 'FALSE' ? 'text-red-600 dark:text-red-400' : 'text-gold-600 dark:text-gold'
              }`}>
              {analysis.label || 'UNCERTAIN'}
            </span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          <div className="glass-card p-10 flex flex-col items-center justify-center border-b-4 border-b-gold">
            <ScoreGauge score={credibilityScore} />
            <button
              onClick={handleReportClick}
              className="mt-10 flex items-center gap-3 px-8 py-4 bg-white dark:bg-navy-950 text-red-500 border-2 border-red-100 dark:border-red-900/30 rounded-[28px] text-xs font-black uppercase tracking-[3px] transition-all hover:bg-red-50 dark:hover:bg-red-950 duration-300"
            >
                <AlertTriangle size={16} /> REPORT INTEGRITY
            </button>
          </div>
          <div className="flex flex-col gap-6">
            <ToneMeter tone={tone} />
            <div className="grid grid-cols-1 gap-6">
              <ReadingLevel level={readingLevel} />
              <div className="glass-card-hover p-8 relative overflow-hidden flex items-center justify-between group">
                <div className="flex items-center gap-5 relative z-10">
                  <div className="w-14 h-14 rounded-[28px] bg-navy-50 dark:bg-navy-950 flex items-center justify-center border border-navy-100 dark:border-navy-800 shadow-inner group-hover:scale-110 transition-transform">
                    <Compass size={24} className="text-navy-400 dark:text-gold" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-navy-400 dark:text-navy-500 uppercase tracking-[3px] block mb-1">Perspective Bias</span>
                    <span className={`text-xl font-black uppercase tracking-tight ${biasDirection === 'Neutral' ? 'text-emerald-600 dark:text-emerald-400' :
                      biasDirection === 'Sensationalist' ? 'text-red-600 dark:text-red-400' :
                        'text-gold-700 dark:text-gold'
                      }`}>
                      {biasDirection}
                    </span>
                  </div>
                </div>
                <div className="text-4xl">
                   {biasDirection === 'Neutral' ? '⚖️' : biasDirection === 'Sensationalist' ? '🔥' : '📐'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Explanation for Live Search */}
      {analysis.isLiveSearch && analysis.explanation && (
        <div className="glass-card p-10 border-l-8 border-l-gold bg-white dark:bg-navy-900/50 shadow-xl">
          <h3 className="text-xs font-black text-navy-900 dark:text-white uppercase tracking-[4px] mb-6 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gold/10 flex items-center justify-center text-gold">
                <Compass size={16} />
            </div>
            NEURAL REASONING
          </h3>
          <p className="text-navy-700 dark:text-navy-100 text-lg leading-relaxed font-bold font-serif">
            "{analysis.explanation}"
          </p>
        </div>
      )}

      {/* Live Search Sources */}
      {analysis.isLiveSearch && analysis.sources?.length > 0 && (
        <div className="glass-card p-8 border-t-4 border-t-navy-100 dark:border-t-navy-800">
          <h3 className="text-[10px] font-black text-navy-400 dark:text-navy-500 uppercase tracking-[4px] mb-8 flex items-center gap-3">
            <Search size={14} /> OSINT DATA SOURCES
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {analysis.sources.map((src, i) => (
              <a 
                key={i} 
                href={src.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-6 rounded-[32px] bg-navy-50 dark:bg-navy-950/50 border border-navy-100 dark:border-navy-800 hover:border-gold dark:hover:border-gold transition-all duration-300 group"
              >
                <h4 className="text-sm font-black text-navy-900 dark:text-white mb-2 line-clamp-1 group-hover:text-gold transition-colors">
                  {src.title}
                </h4>
                <p className="text-[13px] text-navy-400 dark:text-navy-600 line-clamp-2 leading-relaxed mb-3">{src.content}</p>
                <div className="text-[10px] font-black text-gold uppercase tracking-widest flex items-center gap-2">
                    SOURCE LINK <ExternalLink size={10} />
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Signal Cards (Only for standard) */}
      {!analysis.isLiveSearch && (
        <div className="pt-8">
          <h3 className="text-[10px] font-black text-navy-400 dark:text-navy-500 uppercase tracking-[4px] mb-8 flex items-center gap-3 ml-2">
            <div className="w-6 h-6 rounded-lg bg-navy-900 dark:bg-gold text-white dark:text-navy-900 flex items-center justify-center">
                <Zap size={12} />
            </div>
            SIGNAL INTELLIGENCE
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <SignalCard
              icon={MessageSquareWarning}
              title="Emotional Triggers"
              value={`${signals?.emotionalLanguageCount ?? 0} MATCHES`}
              description="High-intensity linguistic patterns used to bypass critical thinking."
              severity={emotionalSeverity}
              detail={signals?.emotionalPhrases?.length > 0 ? signals.emotionalPhrases : null}
            />
            <SignalCard
              icon={Search}
              title="Citations GAP"
              value={`${signals?.unsourcedClaimsCount ?? 0} VOIDS`}
              description="Assertions lacking verifiable, primary source documentation."
              severity={unsourcedSeverity}
              detail={signals?.unsourcedClaims?.length > 0 ? signals.unsourcedClaims : null}
            />
            <SignalCard
              icon={Zap}
              title="Binary Bias"
              value={`${signals?.absoluteStatementsCount ?? 0} ABSOLUTES`}
              description='Presence of non-negotiable logic that removes nuance.'
              severity={absoluteSeverity}
              detail={signals?.absoluteStatements?.length > 0 ? signals.absoluteStatements : null}
            />
            <SignalCard
              icon={Compass}
              title="Ideological Tilt"
              value={biasDirection.toUpperCase()}
              description="Detected deviation from neutral, objective perspective."
              severity={biasSeverity}
            />
          </div>
        </div>
      )}

      {/* Missing Context */}
      <div className="pt-4">
        <MissingContext items={missingContext} />
      </div>

      {/* Claims */}
      <ClaimsSection claims={claims || []} />

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onContinue={handleContinueReport}
        copied={copied}
        articleText={articleText}
      />
    </div>
  );
}
