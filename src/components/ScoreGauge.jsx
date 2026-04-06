import { useEffect, useRef } from 'react';

const RADIUS = 70;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function getScoreColor(score) {
  if (score <= 40) return { stroke: '#ef4444', text: 'text-red-500 dark:text-red-400', label: 'High Risk', bg: 'rgba(239,68,68,0.1)' };
  if (score <= 70) return { stroke: '#f59e0b', text: 'text-gold-600 dark:text-gold-400', label: 'Questionable', bg: 'rgba(249,141,7,0.1)' };
  return { stroke: '#10b981', text: 'text-emerald-600 dark:text-emerald-400', label: 'Credible', bg: 'rgba(16,185,129,0.1)' };
}

export default function ScoreGauge({ score }) {
  const circleRef = useRef(null);
  const { stroke, text, label, bg } = getScoreColor(score);

  const targetOffset = CIRCUMFERENCE - (score / 100) * CIRCUMFERENCE;

  useEffect(() => {
    if (!circleRef.current) return;
    circleRef.current.style.strokeDashoffset = CIRCUMFERENCE;
    void circleRef.current.getBoundingClientRect();
    circleRef.current.style.transition = 'stroke-dashoffset 2.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
    circleRef.current.style.strokeDashoffset = targetOffset;
  }, [score, targetOffset]);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative group p-4" style={{ width: 240, height: 240 }}>
        {/* Glow background */}
        <div
          className="absolute inset-8 rounded-full blur-3xl opacity-20 transition-all duration-1000 group-hover:scale-125"
          style={{ background: stroke }}
        />
        
        <svg width="200" height="200" viewBox="0 0 200 200" className="relative z-10 mx-auto drop-shadow-2xl">
          <defs>
            <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={stroke} />
              <stop offset="100%" stopColor={stroke} stopOpacity="0.6" />
            </linearGradient>
            <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
          </defs>
          {/* Track ring */}
          <circle
            cx="100"
            cy="100"
            r={RADIUS}
            fill="none"
            stroke="currentColor"
            className="text-navy-100 dark:text-navy-900"
            strokeWidth="12"
          />
          {/* Score ring */}
          <circle
            ref={circleRef}
            cx="100"
            cy="100"
            r={RADIUS}
            fill="none"
            stroke="url(#scoreGrad)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE}
            filter="url(#glow)"
            style={{
              transform: 'rotate(-90deg)',
              transformOrigin: '100px 100px',
            }}
          />
          {/* Score text */}
          <text
            x="100"
            y="95"
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="52"
            fontWeight="900"
            className="fill-navy-900 dark:fill-white font-black"
            style={{ letterSpacing: '-0.05em' }}
          >
            {score}
          </text>
          <text
            x="100"
            y="125"
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="11"
            fontWeight="800"
            className="fill-navy-400 uppercase tracking-[3px]"
          >
            SCORE
          </text>
        </svg>
      </div>

      {/* Label */}
      <div className="text-center -mt-4">
        <span className={`text-4xl font-black uppercase tracking-tighter sm:tracking-tight block mb-1 ${text}`}>
          {label}
        </span>
        <div className="text-[10px] font-black text-navy-400 dark:text-navy-500 uppercase tracking-[4px] border-t border-navy-100 dark:border-navy-900 pt-3">
          Neural Veracity Index
        </div>
      </div>
    </div>
  );
}
