import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { Pencil, Star, Trash2, X } from 'lucide-react';
import { Overlay } from './Overlay';
import { EmojiTile } from './EmojiTile';
import { Visualizer } from './Visualizer';
import { StylePicker } from './StylePicker';
import { ProgressRing } from './ProgressRing';
import { Celebration } from './Celebration';
import { Button, IconButton } from './Button';
import { breakdown, formatLongDate, formatTime, progress, relative } from '../lib/time';
import { getTheme } from '../lib/themes';
import { useNow, useNowSelector } from '../lib/useNow';
import { springBouncy, springLayout, springSoft } from '../lib/motion';

const contentIn = {
  hidden: { opacity: 0, y: 12 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { ...springSoft, delay: 0.12 + i * 0.05 } }),
  exit: { opacity: 0, transition: { duration: 0.1 } },
};

// El panel (nodo con layoutId) no escucha el reloj; DetailBody sí.
export function DetailView({ item, origin, featured, onClose, onEdit, onDelete, onStyle, onFeature }) {
  const theme = getTheme(item.theme);
  const done = useNowSelector(useCallback((now) => item.target <= now, [item.target]));

  return (
    <Overlay onClose={onClose}>
      <motion.div
        layoutId={`${origin}-${item.id}`}
        transition={springLayout}
        style={{ borderRadius: 32 }}
        role="dialog"
        aria-modal="true"
        aria-label={item.title}
        className="relative z-10 max-h-[calc(100dvh-16px)] w-full max-w-2xl overflow-y-auto overflow-x-hidden border border-hairline bg-surface-1 shadow-3 no-scrollbar"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-64 opacity-20"
          style={{ background: `radial-gradient(80% 100% at 50% 0%, ${theme.from}, transparent)` }}
        />

        <DetailBody
          item={item}
          theme={theme}
          origin={origin}
          featured={featured}
          onClose={onClose}
          onEdit={onEdit}
          onDelete={onDelete}
          onStyle={onStyle}
          onFeature={onFeature}
        />

        {done && <Celebration theme={theme} count={48} />}
      </motion.div>
    </Overlay>
  );
}

function DetailBody({ item, theme, origin, featured, onClose, onEdit, onDelete, onStyle, onFeature }) {
  const now = useNow();
  const t = breakdown(item.target, now);
  const p = progress(item.createdAt, item.target, now);

  return (
        <div className="relative p-6 sm:p-10">
          <div className="flex items-start justify-between">
            <EmojiTile emoji={item.emoji} theme={theme} size={72} layoutId={`${origin}-emoji-${item.id}`} />
            <motion.div variants={contentIn} custom={0} initial="hidden" animate="visible" exit="exit">
              <IconButton aria-label="Cerrar" onClick={onClose}>
                <X size={20} />
              </IconButton>
            </motion.div>
          </div>

          <motion.div variants={contentIn} custom={1} initial="hidden" animate="visible" exit="exit" className="mt-6">
            {t.done && (
              <motion.p
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ ...springBouncy, delay: 0.3 }}
                className="mb-1 font-ui text-17 font-semibold"
                style={{ color: theme.from }}
              >
                ¡Llegó el día! 🎉
              </motion.p>
            )}
            <h2 className="font-ui text-28 sm:text-[40px] sm:leading-[44px]">{item.title}</h2>
            <p className="mt-1 font-ui text-15 text-text-2">
              {formatLongDate(item.target)} · {formatTime(item.target)}
            </p>
          </motion.div>

          <motion.div variants={contentIn} custom={2} initial="hidden" animate="visible" exit="exit" className="mt-10">
            <Visualizer style={item.style} item={item} t={t} p={p} theme={theme} size="lg" />
          </motion.div>

          <motion.div variants={contentIn} custom={3} initial="hidden" animate="visible" exit="exit" className="mt-10">
            <span className="mb-3 block font-ui text-13 font-semibold text-text-2">Estilo</span>
            <StylePicker value={item.style ?? 'digits'} onChange={onStyle} theme={theme} layoutId="detail-style-sel" />
          </motion.div>

          <motion.div
            variants={contentIn}
            custom={4}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="mt-6 flex items-center gap-6 rounded-card bg-text-1/[0.04] p-5"
          >
            <ProgressRing value={p} theme={theme} size={88} stroke={7} delay={0.3}>
              <span className="font-ui text-17 font-semibold tabular-nums">{Math.round(p * 100)}%</span>
            </ProgressRing>
            <dl className="grid flex-1 gap-3 font-ui text-15">
              <div className="flex justify-between gap-4">
                <dt className="text-text-2">{t.done ? 'Terminó' : 'Llega'}</dt>
                <dd className="font-medium">{relative(item.target, now)}</dd>
              </div>
              <div className="h-px bg-hairline" />
              <div className="flex justify-between gap-4">
                <dt className="text-text-2">Creado</dt>
                <dd className="text-right font-medium">{relative(item.createdAt, now)}</dd>
              </div>
            </dl>
          </motion.div>

          <motion.div variants={contentIn} custom={5} initial="hidden" animate="visible" exit="exit" className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
            <Button variant="secondary" className="px-3" onClick={onFeature}>
              <Star size={16} fill={featured ? '#ff9f0a' : 'none'} color={featured ? '#ff9f0a' : 'currentColor'} />
              {featured ? 'Destacado' : 'Destacar'}
            </Button>
            <Button variant="secondary" className="px-3" onClick={onEdit}>
              <Pencil size={16} /> Editar
            </Button>
            <Button variant="danger" className="px-3" onClick={onDelete}>
              <Trash2 size={16} /> Eliminar
            </Button>
          </motion.div>
        </div>
  );
}
