import { useId } from 'react';
import { motion } from 'framer-motion';
import { easeOutExpo } from '../lib/motion';

// Anillo estilo Actividad del Apple Watch. pathLength se interpola con
// easeOutExpo (es un VALOR, no posición de UI).
export function ProgressRing({ value, theme, size = 44, stroke = 5, delay = 0, children }) {
  const id = useId();
  const r = 50 - stroke;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={theme.from} />
            <stop offset="100%" stopColor={theme.to} />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r={r} fill="none" stroke={theme.from} strokeOpacity={0.14} strokeWidth={stroke * 2} />
        <motion.circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth={stroke * 2}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: Math.max(0.001, value) }}
          transition={{ duration: 1.4, ease: easeOutExpo, delay }}
        />
      </svg>
      {children && <div className="absolute inset-0 flex items-center justify-center">{children}</div>}
    </div>
  );
}
