import { useState, useRef } from 'react';
import { BookOpen } from 'lucide-react';
import { parseAnnotatedText, TOOLTIP_DESCRIPTIONS } from '../utils/parseAnnotatedText';

const TYPE_STYLES = {
  emotional: {
    base: 'bg-gold-100/40 dark:bg-gold-400/20 text-navy-900 dark:text-gold-200 rounded-sm px-1 cursor-pointer relative group inline font-medium',
    border: 'border-b-2 border-gold',
    label: '⚠️ Emotional Trigger',
    tooltip: TOOLTIP_DESCRIPTIONS.emotional,
    color: '#D4AF37'
  },
  unsourced: {
    base: 'bg-red-100/40 dark:bg-red-900/30 text-red-900 dark:text-red-300 rounded-sm px-1 cursor-pointer relative group inline font-medium',
    border: 'border-b-2 border-red-500',
    label: '❌ Citation Gap',
    tooltip: TOOLTIP_DESCRIPTIONS.unsourced,
    color: '#ef4444'
  },
  absolute: {
    base: 'bg-navy-100/40 dark:bg-navy-800/50 text-navy-900 dark:text-navy-300 rounded-sm px-1 cursor-pointer relative group inline font-medium',
    border: 'border-b-2 border-navy-500 dark:border-navy-400',
    label: '🔴 Binary Logic',
    tooltip: TOOLTIP_DESCRIPTIONS.absolute,
    color: '#395374'
  },
};

function HighlightedSpan({ type, content }) {
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const [showTooltip, setShowTooltip] = useState(false);
  const spanRef = useRef(null);
  const style = TYPE_STYLES[type];

  const handleMouseEnter = () => {
    if (spanRef.current) {
      const rect = spanRef.current.getBoundingClientRect();
      setTooltipPos({
        top: rect.top + window.scrollY - 12,
        left: rect.left + rect.width / 2 + window.scrollX,
      });
    }
    setShowTooltip(true);
  };

  return (
    <>
      <span
        ref={spanRef}
        className={`${style.base} ${style.border} transition-all duration-300 hover:scale-105 hover:z-10`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {content}
      </span>
      {showTooltip && (
        <div
          className="fixed z-[100] pointer-events-none animate-fade-in"
          style={{ top: tooltipPos.top, left: tooltipPos.left, transform: 'translate(-50%, -100%)' }}
        >
          <div className="bg-navy-900 dark:bg-navy-950 border border-navy-800 dark:border-navy-800 rounded-[20px] px-5 py-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] max-w-[260px]">
            <p className="text-[10px] font-black mb-1 uppercase tracking-[2px]" style={{ color: style.color }}>
              {style.label}
            </p>
            <p className="text-sm text-navy-200 dark:text-navy-300 leading-relaxed font-medium">{style.tooltip}</p>
          </div>
        </div>
      )}
    </>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap gap-6 text-[10px] font-black uppercase tracking-[2px] text-navy-400">
      <div className="flex items-center gap-3">
        <span className="w-4 h-4 rounded-lg bg-gold/20 border-b-2 border-gold inline-block shadow-sm" />
        Emotional Trigger
      </div>
      <div className="flex items-center gap-3">
        <span className="w-4 h-4 rounded-lg bg-red-500/20 border-b-2 border-red-500 inline-block shadow-sm" />
        Citation Gap
      </div>
      <div className="flex items-center gap-3">
        <span className="w-4 h-4 rounded-lg bg-navy-500/20 border-b-2 border-navy-500 inline-block shadow-sm" />
        Binary Logic
      </div>
    </div>
  );
}

export default function ArticleViewTab({ analysis, articleText }) {
  const { annotatedText } = analysis || {};
  const textToRender = annotatedText || articleText || '';
  const segments = parseAnnotatedText(textToRender);

  const hasAnnotations = segments.some(s => s.type !== 'text');

  return (
    <div className="space-y-6 animate-fade-in py-4">
      {/* Legend */}
      <div className="glass-card p-6 border-b-4 border-b-gold">
        <p className="text-[10px] text-navy-400 dark:text-navy-500 mb-4 font-black uppercase tracking-[3px]">Semantic Highlights Legend</p>
        <Legend />
      </div>

      {!hasAnnotations && (
        <div className="glass-card p-6 text-sm text-gold-700 dark:text-gold flex items-center gap-3 border-l-4 border-l-gold bg-gold-50 dark:bg-gold/5">
          <div className="w-8 h-8 rounded-xl bg-gold/10 flex items-center justify-center">
            <span>⚠️</span>
          </div>
          <span className="font-bold">Neural annotation unavailable for this article. Showing raw textual data.</span>
        </div>
      )}

      {/* Article text */}
      <div className="glass-card p-10 sm:p-12 shadow-2xl relative overflow-hidden bg-white dark:bg-navy-900/60">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <BookOpen size={200} className="text-navy-900 dark:text-white" />
        </div>
        <div className="relative z-10 prose prose-navy dark:prose-invert prose-lg max-w-none leading-loose text-navy-800 dark:text-navy-100 text-[17px] sm:text-[19px] font-serif scrollbar-thin">
          {segments.length > 0 ? segments.map((seg, i) => {
            if (seg.type === 'text') {
              // Preserve paragraph breaks
              const lines = seg.content.split('\n');
              return lines.map((line, j) => (
                <span key={`${i}-${j}`}>
                  {line}
                  {j < lines.length - 1 && <br />}
                </span>
              ));
            }
            return (
              <HighlightedSpan key={i} type={seg.type} content={seg.content} />
            );
          }) : (
            <p>Scanning text data...</p>
          )}
        </div>
      </div>
    </div>
  );
}
