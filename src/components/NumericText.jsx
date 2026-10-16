import { forwardRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../lib/cn';
import { spring } from '../lib/motion';
import { LITE } from '../lib/perf';

// Se anima `transform` como cadena (no `y`/`scale` por separado): así Framer
// lo pasa a Web Animations y corre en el compositor, fuera del hilo principal.
const IN = 'translateY(-55%) scale(0.9)';
const REST = 'translateY(0%) scale(1)';
const OUT = 'translateY(55%) scale(0.9)';
const DIGIT_FULL = {
  initial: { transform: IN, opacity: 0, filter: 'blur(6px)' },
  animate: { transform: REST, opacity: 1, filter: 'blur(0px)', transitionEnd: { filter: 'none' } },
  exit: { transform: OUT, opacity: 0, filter: 'blur(6px)' },
};
// En móvil: el mismo movimiento sin blur.
const DIGIT_LITE = {
  initial: { transform: IN, opacity: 0 },
  animate: { transform: REST, opacity: 1 },
  exit: { transform: OUT, opacity: 0 },
};

// Transición de dígitos tipo `.contentTransition(.numericText(countsDown:))`
// de SwiftUI: cada dígito cambia por separado, el viejo cae y se desenfoca,
// el nuevo baja desde arriba y se enfoca. Los dígitos se identifican por su
// posición desde la derecha para que 100 → 99 anime solo los que cambian.
export function NumericText({ value, className }) {
  const str = String(value);
  const chars = str.split('');
  return (
    <span className={cn('relative inline-flex tabular-nums', className)} aria-label={str}>
      <AnimatePresence initial={false} mode="popLayout">
        {chars.map((ch, i) => (
          <Digit key={chars.length - i} ch={ch} />
        ))}
      </AnimatePresence>
    </span>
  );
}

const Digit = forwardRef(function Digit({ ch }, ref) {
  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0, width: 0 }}
      animate={{ opacity: 1, width: 'auto' }}
      exit={{ opacity: 0, width: 0 }}
      transition={spring}
      className="relative inline-flex justify-center"
      aria-hidden
    >
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={ch}
          {...(LITE ? DIGIT_LITE : DIGIT_FULL)}
          transition={spring}
          className="inline-block"
        >
          {ch}
        </motion.span>
      </AnimatePresence>
    </motion.span>
  );
});
