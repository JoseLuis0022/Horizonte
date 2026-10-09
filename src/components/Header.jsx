import { motion, useScroll, useTransform } from 'framer-motion';
import { Plus } from 'lucide-react';
import { springSnappy } from '../lib/motion';
import { formatToday } from '../lib/time';
import { useNow } from '../lib/useNow';

// Large Title de iOS: el título grande se encoge y desvanece al hacer scroll
// mientras aparece la barra de vidrio con el título compacto.
export function Header({ onCreate, composerOpen }) {
  const now = useNow();
  const { scrollY } = useScroll();
  const titleScale = useTransform(scrollY, [0, 90], [1, 0.92]);
  const titleOpacity = useTransform(scrollY, [10, 70], [1, 0]);
  const titleY = useTransform(scrollY, [0, 90], [0, -12]);
  const barOpacity = useTransform(scrollY, [50, 90], [0, 1]);

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-40 pt-[env(safe-area-inset-top)]">
        <motion.div
          style={{ opacity: barOpacity }}
          className="absolute inset-0 border-b border-hairline bg-[var(--glass)] backdrop-blur-2xl backdrop-saturate-150"
        />
        <div className="relative mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-8">
          <span className="w-11" />
          <motion.span style={{ opacity: barOpacity }} className="font-ui text-17 font-semibold">
            Countdowns
          </motion.span>
          {/* El composer emerge desde este botón (ver lib/origin.js) */}
          <motion.button
            data-create
            onClick={onCreate}
            aria-label="Nuevo countdown"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.9 }}
            transition={springSnappy}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-white shadow-2"
          >
            <motion.span animate={{ rotate: composerOpen ? 45 : 0 }} transition={springSnappy} className="flex">
              <Plus size={22} strokeWidth={2.5} />
            </motion.span>
          </motion.button>
        </div>
      </div>

      <motion.header
        style={{ scale: titleScale, opacity: titleOpacity, y: titleY }}
        className="mx-auto max-w-6xl origin-left px-4 pt-[calc(56px+env(safe-area-inset-top))] sm:px-8"
      >
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="font-ui text-13 font-semibold uppercase tracking-wide text-text-2"
        >
          {formatToday(now)}
        </motion.p>
        <h1 className="font-ui text-[40px] font-bold leading-[44px] tracking-tight sm:text-[52px] sm:leading-[56px]">
          <AnimatedWord text="Countdowns" />
        </h1>
      </motion.header>
    </>
  );
}

// Entrada letra por letra con blur, como un título de keynote.
function AnimatedWord({ text }) {
  return (
    <span aria-label={text} className="inline-flex">
      {text.split('').map((ch, i) => (
        <motion.span
          key={i}
          aria-hidden
          initial={{ opacity: 0, y: 18, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ type: 'spring', stiffness: 260, damping: 26, delay: 0.1 + i * 0.035 }}
          className="inline-block"
        >
          {ch}
        </motion.span>
      ))}
    </span>
  );
}
