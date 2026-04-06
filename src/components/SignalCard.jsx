import { useState } from 'react';

const SEVERITY_STYLES = {
  high: 'border-l-red-500 bg-red-50 dark:bg-red-950/20',
  medium: 'border-l-gold bg-gold-50 dark:bg-gold-950/30',
  low: 'border-l-navy-400 bg-navy-50/50 dark:bg-navy-900/30',
  info: 'border-l-navy-600 bg-navy-50 dark:bg-navy-950/20',
  neutral: 'border-l-navy-200 bg-slate-100 dark:bg-navy-900/20',
};

const ICON_BG = {
  high: 'bg-red-500 text-white',
  medium: 'bg-gold text-navy-950',
  low: 'bg-navy-600 text-white',
  info: 'bg-navy-800 text-gold shadow-lg',
  neutral: 'bg-navy-100 text-navy-600 dark:bg-navy-800 dark:text-navy-300',
};

export default function SignalCard({ icon: Icon, title, value, description, severity = 'neutral', detail }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`border-l-4 rounded-3xl p-6 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group ${SEVERITY_STYLES[severity]}`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start gap-5">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-110 ${ICON_BG[severity]}`}>
          <Icon size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3 mb-1">
            <span className="text-xs font-black text-navy-400 dark:text-navy-500 uppercase tracking-[2px]">{title}</span>
            <span className={`text-sm font-black whitespace-nowrap ${
              severity === 'high' ? 'text-red-600 dark:text-red-400' :
              severity === 'medium' ? 'text-gold-700 dark:text-gold-400' :
              severity === 'low' ? 'text-navy-700 dark:text-navy-300' :
              severity === 'info' ? 'text-navy-800 dark:text-gold' : 'text-navy-500 dark:text-navy-400'
            }`}>
              {value}
            </span>
          </div>
          <p className="text-[13px] text-navy-600 dark:text-navy-400 font-medium leading-relaxed">{description}</p>
          
          {/* Expandable detail */}
          {detail && expanded && (
            <div className="mt-4 pt-4 border-t border-navy-100 dark:border-white/5 space-y-2 animate-fade-in">
              <span className="text-[10px] uppercase tracking-widest font-black text-navy-400 mb-2 block">Detection Insights</span>
              {Array.isArray(detail) ? (
                <ul className="space-y-3">
                  {detail.map((item, i) => (
                    <li key={i} className="text-sm text-navy-700 dark:text-navy-200 flex gap-3 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-gold mt-2 flex-shrink-0" />
                      <span className="font-serif">"{item}"</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-navy-700 dark:text-navy-200 italic font-serif leading-relaxed">"{detail}"</p>
              )}
            </div>
          )}

          {detail && (
            <div className="flex items-center gap-2 mt-4 text-[10px] font-black uppercase tracking-[2px] text-navy-400 dark:text-navy-500 group-hover:text-navy-900 dark:group-hover:text-gold transition-colors">
              <div className="w-4 h-0.5 bg-current" />
              {expanded ? 'Hide Evidence' : 'View Evidence'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
