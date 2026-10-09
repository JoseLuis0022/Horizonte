import { forwardRef, memo } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Plus } from 'lucide-react';
import { EmojiTile } from './EmojiTile';
import { Visualizer } from './Visualizer';
import { SELF_PROGRESS } from '../lib/styles';
import { Button } from './Button';
import { breakdown, formatDate, progress } from '../lib/time';
import { getTheme, gradient } from '../lib/themes';
import { useNow } from '../lib/useNow';
import { easeOutExpo, springLayout, springSoft } from '../lib/motion';

// La raíz (con layoutId) no escucha el reloj: solo HeroBody re-renderiza
// cada segundo, así Framer no re-mide el layout de la página en cada tick.
export const Hero = memo(forwardRef(function Hero({ item, featured, onOpen }, ref) {
  const theme = getTheme(item.theme);

  return (
    <motion.div
      ref={ref}
      layoutId={`hero-${item.id}`}
      transition={springLayout}
      initial={{ opacity: 0, y: 16, filter: 'blur(10px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }}
      exit={{ opacity: 0, y: -8, filter: 'blur(10px)' }}
      style={{ borderRadius: 32 }}
      className="relative overflow-hidden border border-hairline bg-surface-1 shadow-2"
    >
      {/* Halo cónico girando lentamente: el "motion graphic" de fondo */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full opacity-25 blur-3xl will-change-transform"
        style={{ background: `conic-gradient(from 0deg, ${theme.from}, ${theme.to}, ${theme.from})`, animation: 'spin 18s linear infinite' }}
      />
      <HeroBody item={item} theme={theme} featured={featured} onOpen={onOpen} />
    </motion.div>
  );
}));

function HeroBody({ item, theme, featured, onOpen }) {
  const now = useNow();
  const t = breakdown(item.target, now);
  const p = progress(item.createdAt, item.target, now);

  return (
      <motion.button
        onClick={onOpen}
        whileTap={{ scale: 0.99 }}
        transition={springSoft}
        className="group relative block w-full p-6 text-left sm:p-10"
      >
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-2 rounded-full bg-text-1/[0.05] px-3 py-1.5 font-ui text-12 font-semibold uppercase tracking-wide text-text-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inset-0 animate-ping rounded-full opacity-60" style={{ background: theme.from }} />
              <span className="relative h-2 w-2 rounded-full" style={{ background: theme.from }} />
            </span>
            {featured ? 'Destacado' : 'Lo siguiente'}
          </span>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-text-1/[0.05] text-text-2 transition-all duration-200 group-hover:rotate-45 group-hover:bg-text-1 group-hover:text-bg">
            <ArrowUpRight size={18} />
          </span>
        </div>

        <div className="mt-6 flex items-center gap-4">
          <EmojiTile emoji={item.emoji} theme={theme} size={56} layoutId={`hero-emoji-${item.id}`} />
          <div className="min-w-0">
            <h2 className="truncate font-ui text-22 sm:text-28">{item.title}</h2>
            <p className="font-ui text-15 text-text-2">{formatDate(item.target)}</p>
          </div>
        </div>

        <div className="mt-8 sm:mt-10">
          <Visualizer style={item.style} item={item} t={t} p={p} theme={theme} size="lg" />
        </div>

        {!SELF_PROGRESS.has(item.style) && (
        <div className="mt-8 flex items-center gap-4">
          <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-text-1/[0.07]">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ background: gradient(theme, 90) }}
              initial={{ width: 0 }}
              animate={{ width: `${p * 100}%` }}
              transition={{ duration: 1.6, ease: easeOutExpo, delay: 0.3 }}
            />
          </div>
          <span className="font-ui text-13 font-semibold tabular-nums text-text-2">{Math.round(p * 100)}%</span>
        </div>
        )}
      </motion.button>
  );
}

export const HeroEmpty = forwardRef(function HeroEmpty({ onCreate }, ref) {
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16, filter: 'blur(10px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }}
      exit={{ opacity: 0, filter: 'blur(10px)' }}
      transition={springSoft}
      className="flex flex-col items-center rounded-modal border border-dashed border-text-3/40 bg-surface-1/60 px-6 py-16 text-center backdrop-blur-xl"
    >
      <motion.span
        className="text-[56px]"
        animate={{ y: [0, -8, 0], rotate: [0, -6, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        🌙
      </motion.span>
      <h2 className="mt-4 font-ui text-22">Nada en el horizonte</h2>
      <p className="mt-1 max-w-sm font-ui text-15 text-text-2">Crea un countdown para el próximo momento que estás esperando.</p>
      <Button className="mt-6" onClick={onCreate}>
        <Plus size={18} /> Crear countdown
      </Button>
    </motion.div>
  );
});
