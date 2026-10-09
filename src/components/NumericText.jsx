import { forwardRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../lib/cn';
import { spring } from '../lib/motion';

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
      layout="position"
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
          initial={{ y: '-55%', opacity: 0, filter: 'blur(6px)', scale: 0.9 }}
          animate={{ y: '0%', opacity: 1, filter: 'blur(0px)', scale: 1 }}
          exit={{ y: '55%', opacity: 0, filter: 'blur(6px)', scale: 0.9 }}
          transition={spring}
          className="inline-block"
        >
          {ch}
        </motion.span>
      </AnimatePresence>
    </motion.span>
  );
});
