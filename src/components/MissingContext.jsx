import { AlertCircle } from 'lucide-react';

export default function MissingContext({ items = [] }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="glass-card-hover p-8 border-l-4 border-l-gold bg-white dark:bg-navy-900/40">
      <div className="flex items-start gap-5 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gold/10 dark:bg-gold/20 flex items-center justify-center border border-gold/20 shadow-inner">
          <AlertCircle size={24} className="text-gold-600 dark:text-gold" />
        </div>
        <div>
          <h3 className="text-xl font-black text-navy-900 dark:text-white tracking-tight uppercase">Omitted Context</h3>
          <p className="text-[13px] text-navy-400 dark:text-navy-500 font-bold uppercase tracking-widest mt-1">Linguistic Voids Detected</p>
        </div>
      </div>

      <ul className="space-y-6">
        {items.map((item, i) => (
          <li key={i} className="flex gap-4 items-start group animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
            <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-navy-50 dark:bg-navy-950 flex items-center justify-center mt-0.5 border border-navy-100 dark:border-navy-800 shadow-sm transition-transform group-hover:scale-110">
              <span className="text-gold font-black text-xs">{i + 1}</span>
            </div>
            <div className="flex-1">
                <p className="text-base text-navy-700 dark:text-navy-200 leading-relaxed font-medium group-hover:text-navy-950 dark:group-hover:text-white transition-colors">
                    {item}
                </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
