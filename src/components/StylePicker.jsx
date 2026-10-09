import { motion } from 'framer-motion';
import { STYLES } from '../lib/styles';
import { cn } from '../lib/cn';
import { spring, springSnappy } from '../lib/motion';

// Glifos mini de cada estilo, dibujados con el color del tema.
function Glyph({ k, theme }) {
  const c = theme.from;
  const soft = `${theme.from}33`;
  switch (k) {
    case 'digits':
      return <span className="font-ui text-[17px] font-bold tabular-nums" style={{ color: c }}>12</span>;
    case 'rings':
      return (
        <svg viewBox="0 0 24 24" className="h-6 w-6 -rotate-90">
          <circle cx="12" cy="12" r="10" fill="none" stroke={soft} strokeWidth="3" />
          <circle cx="12" cy="12" r="10" fill="none" stroke={c} strokeWidth="3" strokeDasharray="44 63" strokeLinecap="round" />
          <circle cx="12" cy="12" r="5" fill="none" stroke={theme.to} strokeWidth="3" strokeDasharray="20 32" strokeLinecap="round" />
        </svg>
      );
    case 'bar':
      return (
        <span className="h-2.5 w-8 overflow-hidden rounded-full" style={{ background: soft }}>
          <span className="block h-full w-3/5 rounded-full" style={{ background: c }} />
        </span>
      );
    case 'dots':
      return (
        <span className="grid grid-cols-4 gap-0.5">
          {Array.from({ length: 12 }, (_, i) => (
            <span key={i} className="h-1.5 w-1.5 rounded-full" style={{ background: i < 7 ? c : soft }} />
          ))}
        </span>
      );
    case 'columns':
      return (
        <span className="flex h-6 items-end gap-0.5">
          {[0.9, 0.5, 0.75, 0.35].map((h, i) => (
            <span key={i} className="w-1.5 rounded-[2px]" style={{ height: `${h * 100}%`, background: c }} />
          ))}
        </span>
      );
    case 'arc':
      return (
        <svg viewBox="0 0 24 14" className="h-4 w-7">
          <path d="M2 12 A10 10 0 0 1 22 12" fill="none" stroke={soft} strokeWidth="3" strokeLinecap="round" />
          <path d="M2 12 A10 10 0 0 1 15 2.6" fill="none" stroke={c} strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    case 'weeks':
      return (
        <span className="grid grid-flow-col grid-rows-4 gap-0.5">
          {Array.from({ length: 20 }, (_, i) => (
            <span key={i} className="h-1.5 w-1.5 rounded-[1.5px]" style={{ background: i < 11 ? c : soft }} />
          ))}
        </span>
      );
    default:
      return null;
  }
}

export function StylePicker({ value, onChange, theme, layoutId = 'style-sel', className }) {
  return (
    <div className={cn('grid grid-cols-4 gap-2 sm:grid-cols-7', className)}>
      {STYLES.map((s) => {
        const active = s.key === value;
        return (
          <motion.button
            key={s.key}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(s.key)}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.94 }}
            transition={springSnappy}
            className="relative flex h-[68px] flex-col items-center justify-center gap-2 rounded-control bg-text-1/[0.04]"
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                transition={spring}
                className="absolute inset-0 rounded-control border-2 bg-surface-1 shadow-2"
                style={{ borderColor: theme.from }}
              />
            )}
            <span className="relative flex h-6 items-center">
              <Glyph k={s.key} theme={theme} />
            </span>
            <span className={cn('relative font-ui text-12 font-semibold transition-colors', active ? 'text-text-1' : 'text-text-2')}>{s.name}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
