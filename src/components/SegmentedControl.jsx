import { motion } from 'framer-motion';
import { cn } from '../lib/cn';
import { springSnappy } from '../lib/motion';

// Pista gris con pastilla blanca deslizante (layoutId) — igual que CUSOL.
export function SegmentedControl({ options, value, onChange, layoutId = 'segmented', className }) {
  return (
    <div role="tablist" className={cn('inline-flex w-fit items-center gap-0.5 rounded-full bg-text-1/[0.06] p-1', className)}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <motion.button
            key={opt.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            whileTap={{ scale: 0.95 }}
            transition={springSnappy}
            className={cn(
              'relative flex h-9 items-center gap-1.5 rounded-full px-4 font-ui text-13 font-semibold transition-colors duration-150',
              active ? 'text-text-1' : 'text-text-2 hover:text-text-1'
            )}
          >
            {active && (
              <motion.span layoutId={layoutId} transition={springSnappy} className="absolute inset-0 rounded-full bg-surface-1 shadow-2" />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {opt.label}
              {opt.count != null && (
                <span className={cn('tabular-nums transition-colors', active ? 'text-text-2' : 'text-text-3')}>{opt.count}</span>
              )}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
