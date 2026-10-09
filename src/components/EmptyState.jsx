import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { Button } from './Button';
import { springSoft } from '../lib/motion';

const COPY = {
  upcoming: { emoji: '🗓️', title: 'Sin countdowns próximos', body: 'Todo lo que creaste ya pasó. Agenda lo que sigue.' },
  done: { emoji: '🏁', title: 'Aún no termina ninguno', body: 'Cuando un countdown llegue a cero, aparecerá aquí.' },
  all: { emoji: '✨', title: 'Empieza tu primer countdown', body: 'Vacaciones, cumpleaños, lanzamientos: cuenta los días que faltan.' },
};

export const EmptyState = forwardRef(function EmptyState({ filter, onCreate }, ref) {
  const c = COPY[filter];
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.96, filter: 'blur(8px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 0.96, filter: 'blur(8px)' }}
      transition={springSoft}
      className="col-span-full flex flex-col items-center py-16 text-center"
    >
      <motion.span
        className="text-[48px]"
        initial={{ y: 10, rotate: -12 }}
        animate={{ y: [0, -8, 0], rotate: 0 }}
        transition={{ y: { duration: 3, repeat: Infinity, ease: 'easeInOut' }, rotate: springSoft }}
      >
        {c.emoji}
      </motion.span>
      <h3 className="mt-4 font-ui text-22">{c.title}</h3>
      <p className="mt-1 max-w-sm font-ui text-15 text-text-2">{c.body}</p>
      {filter !== 'done' && (
        <Button className="mt-6" variant="secondary" onClick={onCreate}>
          <Plus size={18} /> Crear countdown
        </Button>
      )}
    </motion.div>
  );
});
