import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { Check, Star } from 'lucide-react';
import { EmojiTile } from './EmojiTile';
import { CardViz } from './CardViz';
import { ProgressRing } from './ProgressRing';
import { Celebration } from './Celebration';
import { SELF_PROGRESS } from '../lib/styles';
import { breakdown, formatDate, progress, relative } from '../lib/time';
import { getTheme } from '../lib/themes';
import { useNow, useNowSelector } from '../lib/useNow';
import { justDragged } from '../lib/dragState';
import { cn } from '../lib/cn';
import { MAX_H, dims } from '../lib/grid';
import { springLayout, springSnappy, springSoft } from '../lib/motion';

const finePointer = typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

// Contenido visual de la tarjeta; lo comparten la tarjeta del grid y la copia
// que flota bajo el cursor al arrastrar (sin layoutIds para no duplicarlos).
export function CardContent({ item, index = 0, editing = false, withLayoutIds = true }) {
  const now = useNow();
  const theme = getTheme(item.theme);
  const t = breakdown(item.target, now);
  const p = progress(item.createdAt, item.target, now);
  const { w, h } = dims(item);
  const big = w >= 2 && h >= 2;
  const showRing = !editing && (t.done || !SELF_PROGRESS.has(item.style));

  return (
    <div className="flex h-full flex-col">
      {/* Encabezado en una fila: deja casi toda la tarjeta para los números */}
      <div className="relative flex items-center gap-3">
        <EmojiTile emoji={item.emoji} theme={theme} size={big ? 52 : 40} layoutId={withLayoutIds ? `card-emoji-${item.id}` : undefined} />
        <div className="min-w-0 flex-1">
          <h3 className={cn('truncate font-ui font-semibold leading-tight', big ? 'text-22' : 'text-17')}>{item.title}</h3>
          <p className="truncate font-ui text-13 text-text-2">{formatDate(item.target)}</p>
        </div>
        {showRing && <ProgressRing value={p} theme={theme} size={big ? 40 : 34} delay={0.4 + index * 0.05} />}
      </div>
      <div className="relative mt-4 min-h-0 flex-1">
        {t.done ? (
          <div className="flex h-full items-end gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-ui text-13 font-semibold text-white" style={{ background: theme.from }}>
              <Check size={14} strokeWidth={3} /> Completado
            </span>
            <span className="font-ui text-13 text-text-2">{relative(item.target, now)}</span>
          </div>
        ) : (
          <CardViz style={item.style} item={item} t={t} p={p} theme={theme} />
        )}
      </div>
    </div>
  );
}

export const CountdownCard = forwardRef(function CountdownCard({ item, index, cols = 4, onOpen, editing, featured, onResize, onFeature }, ref) {
  const theme = getTheme(item.theme);
  // La raíz (nodo de layout de Framer) solo re-renderiza cuando el countdown
  // termina; los dígitos que corren viven en CardContent.
  const done = useNowSelector(useCallback((now) => item.target <= now, [item.target]));
  const { w, h } = dims(item);
  const small = w * h === 1;
  const rootRef = useRef(null);

  const { attributes, listeners, setNodeRef, isDragging } = useSortable({ id: item.id });
  const setRefs = useCallback(
    (node) => {
      setNodeRef(node);
      rootRef.current = node;
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
  const amp = small ? 5 : 2.5;
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
    '--jiggle': `${small ? 0.9 : 0.35}deg`,
    '--jiggle-dur': `${0.26 + phase * 0.08}s`,
    animationDelay: `${-phase}s`,
  };

  return (
    <motion.div
      ref={setRefs}
      layoutId={`card-${item.id}`}
      data-open={`card-${item.id}`}
      transition={springLayout}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1, transition: { ...springSoft, delay: 0.25 + index * 0.05 } }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      // Celdas del grid: ancho limitado a las columnas disponibles.
      style={{ borderRadius: 24, perspective: 900, gridColumn: `span ${Math.min(w, cols)}`, gridRow: `span ${h}` }}
      className="relative"
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
            'relative flex h-full w-full flex-col overflow-hidden border p-5 text-left transition-[box-shadow,background-color,border-color] duration-300',
            editing ? 'cursor-grab active:cursor-grabbing' : '',
            isDragging
              ? 'border-dashed border-text-3/50 bg-text-1/[0.03] shadow-none'
              : 'border-hairline bg-surface-1 shadow-1 hover:shadow-3',
            w >= 2 && h >= 2 && 'sm:p-6'
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
          <CardControls key="controls" featured={featured} onFeature={onFeature} />
        )}
        {editing && !isDragging && (
          <ResizeHandle key="resize" rootRef={rootRef} w={w} h={h} cols={cols} color={theme.from} onResize={onResize} />
        )}
      </AnimatePresence>
      {celebrate && <Celebration theme={theme} />}
    </motion.div>
  );
});

function CardControls({ featured, onFeature }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7, y: -6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.7, y: -6 }}
      transition={springSnappy}
      className="absolute right-3 top-3 z-10 flex items-center gap-0.5 rounded-full border border-hairline bg-surface-1 p-1 shadow-2"
    >
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
        dims(item).w >= 2 && dims(item).h >= 2 && 'sm:p-6'
      )}
    >
      <CardContent item={item} withLayoutIds={false} />
    </motion.div>
  );
}

// Tirador de esquina estilo widgets del iPad: arrastrarlo cambia el tamaño en
// celdas del grid (ancho 1…columnas, alto 1…MAX_H) y salta de celda en celda.
function ResizeHandle({ rootRef, w, h, cols, color, onResize }) {
  const drag = useRef(null);
  const [active, setActive] = useState(false);

  const onPointerDown = (e) => {
    e.stopPropagation();
    e.preventDefault();
    const el = rootRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const gap = parseFloat(getComputedStyle(el.parentElement).rowGap) || 16;
    drag.current = {
      x: e.clientX,
      y: e.clientY,
      w,
      h,
      colStep: (r.width + gap) / Math.min(w, cols),
      rowStep: (r.height + gap) / h,
      last: `${w}x${h}`,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
    setActive(true);
  };
  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d) return;
    const nw = Math.max(1, Math.min(cols, Math.round(d.w + (e.clientX - d.x) / d.colStep)));
    const nh = Math.max(1, Math.min(MAX_H, Math.round(d.h + (e.clientY - d.y) / d.rowStep)));
    const key = `${nw}x${nh}`;
    if (key !== d.last) {
      d.last = key;
      onResize({ w: nw, h: nh });
    }
  };
  const end = () => {
    drag.current = null;
    setActive(false);
  };

  return (
    <motion.div
      role="slider"
      aria-label="Cambiar tamaño"
      aria-valuetext={`${Math.min(w, cols)} × ${h}`}
      tabIndex={0}
      onKeyDown={(e) => {
        const step = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] }[e.key];
        if (!step) return;
        e.preventDefault();
        e.stopPropagation();
        onResize({ w: Math.max(1, Math.min(cols, Math.min(w, cols) + step[0])), h: Math.max(1, Math.min(MAX_H, h + step[1])) });
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={end}
      onPointerCancel={end}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: active ? 1.15 : 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={springSnappy}
      className="absolute -bottom-1.5 -right-1.5 z-10 flex h-11 w-11 cursor-nwse-resize touch-none items-center justify-center outline-none"
    >
      <svg viewBox="0 0 32 32" className="h-8 w-8 drop-shadow-[0_1px_3px_rgba(0,0,0,0.18)]">
        <path d="M27 9 A18 18 0 0 1 9 27" fill="none" stroke="#fff" strokeWidth="9" strokeLinecap="round" />
        <path d="M27 9 A18 18 0 0 1 9 27" fill="none" stroke={active ? color : 'var(--text-1)'} strokeWidth="4.5" strokeLinecap="round" />
      </svg>
      <AnimatePresence>
        {active && (
          <motion.span
            initial={{ opacity: 0, y: 6, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.8 }}
            transition={springSnappy}
            className="pointer-events-none absolute bottom-12 right-1 whitespace-nowrap rounded-full bg-text-1 px-2.5 py-1 font-ui text-12 font-semibold tabular-nums text-white"
          >
            {Math.min(w, cols)} × {h}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
