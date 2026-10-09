import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { Check, Star } from 'lucide-react';
import { EmojiTile } from './EmojiTile';
import { Visualizer } from './Visualizer';
import { ProgressRing } from './ProgressRing';
import { Celebration } from './Celebration';
import { SELF_PROGRESS } from '../lib/styles';
import { breakdown, formatDate, progress, relative } from '../lib/time';
import { getTheme } from '../lib/themes';
import { useNow, useNowSelector } from '../lib/useNow';
import { justDragged } from '../lib/dragState';
import { cn } from '../lib/cn';
import { spring, springLayout, springSnappy, springSoft } from '../lib/motion';

// Bento: chico = 1 celda, mediano = 2 de ancho, grande = 2×2.
export const SIZE_CLASS = { s: '', m: 'sm:col-span-2', l: 'sm:col-span-2 sm:row-span-2' };
const SIZES = [
  { key: 's', label: 'Chico', w: 6, h: 6 },
  { key: 'm', label: 'Mediano', w: 12, h: 6 },
  { key: 'l', label: 'Grande', w: 12, h: 12 },
];

const finePointer = typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

// Contenido visual de la tarjeta; lo comparten la tarjeta del grid y la copia
// que flota bajo el cursor al arrastrar (sin layoutIds para no duplicarlos).
export function CardContent({ item, index = 0, editing = false, withLayoutIds = true }) {
  const now = useNow();
  const theme = getTheme(item.theme);
  const t = breakdown(item.target, now);
  const p = progress(item.createdAt, item.target, now);
  const size = item.size ?? 's';
  const big = size === 'l';
  const showRing = !editing && (t.done || !SELF_PROGRESS.has(item.style));

  const ring = showRing && <ProgressRing value={p} theme={theme} size={40} delay={0.4 + index * 0.05} />;
  const emoji = <EmojiTile emoji={item.emoji} theme={theme} size={big ? 56 : 44} layoutId={withLayoutIds ? `card-emoji-${item.id}` : undefined} />;
  const info = (
    <div className="relative mt-4 min-w-0">
      <h3 className={cn('truncate font-ui font-semibold', big ? 'text-22 sm:text-28' : 'text-17')}>{item.title}</h3>
      <p className="truncate font-ui text-13 text-text-2">{formatDate(item.target)}</p>
    </div>
  );
  const body = t.done ? (
    <div className="flex items-center gap-2">
      <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-ui text-13 font-semibold text-white" style={{ background: theme.from }}>
        <Check size={14} strokeWidth={3} /> Completado
      </span>
      <span className="font-ui text-13 text-text-2">{relative(item.target, now)}</span>
    </div>
  ) : (
    <Visualizer style={item.style} item={item} t={t} p={p} theme={theme} size={big ? 'lg' : 'sm'} />
  );

  if (size === 'm') {
    return (
      <div className="flex h-full flex-col gap-6 sm:flex-row">
        <div className="flex min-w-0 flex-col sm:w-[36%]">
          <div className="relative flex items-start justify-between">
            {emoji}
            <span className="sm:hidden">{ring}</span>
          </div>
          {info}
          <span className="relative mt-auto hidden pt-4 sm:block">{ring}</span>
        </div>
        <div className="relative mt-auto flex min-w-0 flex-1 flex-col justify-end">{body}</div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="relative flex items-start justify-between">
        {emoji}
        {ring}
      </div>
      {info}
      {/* En la tarjeta grande la visualización ocupa y se centra en el espacio libre */}
      <div className={cn('relative', big ? 'flex flex-1 flex-col justify-center pt-8' : 'mt-auto pt-6')}>{body}</div>
    </div>
  );
}

export const CountdownCard = forwardRef(function CountdownCard({ item, index, onOpen, editing, featured, onResize, onFeature }, ref) {
  const theme = getTheme(item.theme);
  // La raíz (nodo de layout de Framer) solo re-renderiza cuando el countdown
  // termina; los dígitos que corren viven en CardContent.
  const done = useNowSelector(useCallback((now) => item.target <= now, [item.target]));
  const size = item.size ?? 's';

  const { attributes, listeners, setNodeRef, isDragging } = useSortable({ id: item.id });
  const setRefs = useCallback(
    (node) => {
      setNodeRef(node);
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    [ref, setNodeRef]
  );

  // Celebra si el countdown llega a cero mientras está en pantalla.
  const wasDone = useRef(done);
  const [celebrate, setCelebrate] = useState(false);
  useEffect(() => {
    if (done && !wasDone.current) {
      setCelebrate(true);
      const id = setTimeout(() => setCelebrate(false), 2200);
      return () => clearTimeout(id);
    }
    wasDone.current = done;
  }, [done]);

  // Tilt 3D + reflejo que sigue al puntero (solo mouse/trackpad, fuera de edición).
  const tiltOn = finePointer && !editing && !isDragging;
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const amp = size === 's' ? 5 : 2.5;
  const rotateX = useSpring(useTransform(my, [0, 1], [amp, -amp]), springSoft);
  const rotateY = useSpring(useTransform(mx, [0, 1], [-amp, amp]), springSoft);
  const glareX = useTransform(mx, (v) => `${v * 100}%`);
  const glareY = useTransform(my, (v) => `${v * 100}%`);
  const glare = useMotionTemplate`radial-gradient(420px circle at ${glareX} ${glareY}, ${theme.from}1f, transparent 60%)`;
  const [hover, setHover] = useState(false);
  const reset = () => {
    mx.set(0.5);
    my.set(0.5);
    setHover(false);
  };
  useEffect(() => {
    if (!tiltOn) reset();
  }, [tiltOn]); // eslint-disable-line react-hooks/exhaustive-deps

  // Temblor de "modo edición" tipo iOS, en CSS (compositor) y con fase propia.
  const phase = useMemo(() => Math.random(), []);
  const jiggleStyle = {
    '--jiggle': `${size === 's' ? 0.9 : 0.35}deg`,
    '--jiggle-dur': `${0.26 + phase * 0.08}s`,
    animationDelay: `${-phase}s`,
  };

  return (
    <motion.div
      ref={setRefs}
      layoutId={`card-${item.id}`}
      transition={springLayout}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1, transition: { ...springSoft, delay: 0.25 + index * 0.05 } }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      style={{ borderRadius: 24, perspective: 900 }}
      className={cn('relative', SIZE_CLASS[size])}
    >
      <div className={cn('h-full', editing && !isDragging && 'jiggle')} style={editing ? jiggleStyle : undefined}>
        <motion.button
          {...attributes}
          {...listeners}
          onClick={() => !editing && !justDragged() && onOpen()}
          onPointerMove={(e) => {
            if (!tiltOn) return;
            const r = e.currentTarget.getBoundingClientRect();
            mx.set((e.clientX - r.left) / r.width);
            my.set((e.clientY - r.top) / r.height);
          }}
          onPointerEnter={() => tiltOn && setHover(true)}
          onPointerLeave={reset}
          whileHover={tiltOn ? { y: -4 } : undefined}
          whileTap={editing ? { scale: 1.02 } : { scale: 0.97 }}
          transition={springSoft}
          style={{ rotateX, rotateY, borderRadius: 24 }}
          className={cn(
            'relative flex h-full min-h-[232px] w-full flex-col overflow-hidden border p-5 text-left transition-[box-shadow,background-color,border-color] duration-300',
            editing ? 'cursor-grab active:cursor-grabbing' : '',
            isDragging
              ? 'border-dashed border-text-3/50 bg-text-1/[0.03] shadow-none'
              : 'border-hairline bg-surface-1 shadow-1 hover:shadow-3',
            size === 'l' && 'sm:p-7'
          )}
        >
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ background: glare }}
            animate={{ opacity: hover ? 1 : 0 }}
          />
          <motion.div className="h-full" animate={{ opacity: isDragging ? 0 : 1 }} transition={{ duration: 0.15 }}>
            <CardContent item={item} index={index} editing={editing} />
          </motion.div>
        </motion.button>
      </div>

      <AnimatePresence>
        {editing && !isDragging && (
          <CardControls id={item.id} size={size} onResize={onResize} featured={featured} onFeature={onFeature} />
        )}
      </AnimatePresence>
      {celebrate && <Celebration theme={theme} />}
    </motion.div>
  );
});

function CardControls({ id, size, onResize, featured, onFeature }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7, y: -6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.7, y: -6 }}
      transition={springSnappy}
      className="absolute right-3 top-3 z-10 flex items-center gap-0.5 rounded-full border border-hairline bg-surface-1 p-1 shadow-2"
    >
      {SIZES.map((s) => {
        const active = s.key === size;
        return (
          <motion.button
            key={s.key}
            type="button"
            aria-label={`Tamaño ${s.label}`}
            aria-pressed={active}
            title={s.label}
            onClick={() => onResize(s.key)}
            whileTap={{ scale: 0.85 }}
            transition={springSnappy}
            className="relative flex h-8 w-8 items-center justify-center rounded-full"
          >
            {active && <motion.span layoutId={`size-sel-${id}`} transition={spring} className="absolute inset-0 rounded-full bg-text-1" />}
            <span
              className={cn('relative rounded-[2.5px] border-[1.5px] transition-colors', active ? 'border-white' : 'border-text-2')}
              style={{ width: s.w, height: s.h }}
            />
          </motion.button>
        );
      })}
      <span className="mx-0.5 h-5 w-px bg-hairline" />
      <motion.button
        type="button"
        aria-label={featured ? 'Quitar de destacado' : 'Destacar arriba'}
        aria-pressed={featured}
        title={featured ? 'Quitar de destacado' : 'Destacar arriba'}
        onClick={onFeature}
        whileTap={{ scale: 0.8 }}
        animate={featured ? { scale: [1, 1.3, 1], rotate: [0, -15, 0] } : { scale: 1, rotate: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="flex h-8 w-8 items-center justify-center rounded-full text-text-2"
      >
        <Star size={16} strokeWidth={2.2} fill={featured ? '#ff9f0a' : 'none'} color={featured ? '#ff9f0a' : 'currentColor'} />
      </motion.button>
    </motion.div>
  );
}

// Copia que flota bajo el cursor mientras se arrastra: levantada y girada.
export function CardOverlay({ item }) {
  return (
    <motion.div
      initial={{ scale: 1, rotate: 0 }}
      animate={{ scale: 1.04, rotate: 1.5 }}
      transition={springSnappy}
      className={cn(
        'h-full w-full cursor-grabbing overflow-hidden rounded-card border border-hairline bg-surface-1 p-5 shadow-3',
        item.size === 'l' && 'sm:p-7'
      )}
    >
      <CardContent item={item} withLayoutIds={false} />
    </motion.div>
  );
}
