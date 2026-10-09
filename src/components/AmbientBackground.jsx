import { AnimatePresence, motion } from 'framer-motion';

// Orbes de color desenfocados que derivan lentamente detrás de todo. Toman
// el color del countdown más próximo y hacen crossfade cuando cambia.
export function AmbientBackground({ theme }) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" style={{ opacity: 'var(--orb-opacity)' }}>
      <AnimatePresence>
        <motion.div
          key={theme.from + theme.to}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2 }}
        >
          <Orb color={theme.from} className="-left-[10vw] -top-[20vh] h-[60vh] w-[60vh]" anim="drift-a 26s ease-in-out infinite" />
          <Orb color={theme.to} className="-right-[10vw] top-[10vh] h-[50vh] w-[50vh]" anim="drift-b 32s ease-in-out infinite" />
          <Orb color={theme.from} className="bottom-[-20vh] left-[30vw] h-[45vh] w-[45vh]" anim="drift-c 38s ease-in-out infinite" />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function Orb({ color, className, anim }) {
  return (
    <div
      className={`absolute rounded-full ${className}`}
      style={{
        background: `radial-gradient(circle at center, ${color} 0%, transparent 68%)`,
        filter: 'blur(40px)',
        opacity: 0.55,
        animation: anim,
        willChange: 'transform',
      }}
    />
  );
}
