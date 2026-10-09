import { useId } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { NumericText } from './NumericText';
import { TimeUnits } from './TimeUnits';
import { DAY, pad } from '../lib/time';
import { cn } from '../lib/cn';
import { easeOutExpo, springSoft } from '../lib/motion';

// Punto de entrada: elige la representación según item.style.
// size: 'sm' (tarjeta / vista previa) | 'lg' (hero / detalle).
export function Visualizer({ style = 'digits', ...props }) {
  const Comp = VIZ[style] ?? DigitsViz;
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={style}
        initial={{ opacity: 0, y: 8, filter: 'blur(6px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: -8, filter: 'blur(6px)' }}
        transition={{ duration: 0.25 }}
      >
        <Comp {...props} />
      </motion.div>
    </AnimatePresence>
  );
}

const unit = (n) => (n === 1 ? 'día' : 'días');

function Clock({ t, className }) {
  return (
    <span className={cn('flex items-center font-ui font-medium text-text-2', className)}>
      <NumericText value={pad(t.hours)} />
      <span className="px-0.5 opacity-50">:</span>
      <NumericText value={pad(t.minutes)} />
      <span className="px-0.5 opacity-50">:</span>
      <NumericText value={pad(t.seconds)} className="text-text-1" />
    </span>
  );
}

function BigDays({ t, className = 'text-[44px]' }) {
  return (
    <span className="flex items-baseline gap-1.5">
      <NumericText value={t.days} className={cn('font-ui font-semibold leading-none tracking-tight', className)} />
      <span className="font-ui text-15 font-medium text-text-2">{unit(t.days)}</span>
    </span>
  );
}

/* ───────────── Números ───────────── */
function DigitsViz({ t, theme, size }) {
  if (size === 'lg') return <TimeUnits t={t} theme={theme} sizeClass="text-[clamp(40px,11vw,112px)]" />;
  return (
    <div className="flex items-end justify-between gap-2">
      <BigDays t={t} />
      <Clock t={t} className="text-17" />
    </div>
  );
}

/* ───────────── Anillos (Actividad) ───────────── */
function Arc({ r, stroke, value, color, gradId, delay }) {
  return (
    <>
      <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeOpacity={0.15} strokeWidth={stroke} />
      <motion.circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke={gradId ? `url(#${gradId})` : color}
        strokeWidth={stroke}
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: Math.max(0.002, value) }}
        transition={{ type: 'spring', stiffness: 70, damping: 18, delay }}
      />
    </>
  );
}

function RingsViz({ t, p, theme, size }) {
  const id = useId();
  const lg = size === 'lg';
  const dayFrac = 1 - (t.hours * 60 + t.minutes) / 1440;
  const secFrac = 1 - t.seconds / 60;
  const px = lg ? 'clamp(180px, 44vw, 260px)' : '96px';
  const legend = [
    [theme.from, 'Total', `${Math.round(p * 100)}%`],
    [theme.to, 'Día', `${pad(t.hours)}:${pad(t.minutes)}`],
    ['#ff9f0a', 'Minuto', `${pad(t.seconds)} s`],
  ];
  return (
    <div className={cn('flex items-center', lg ? 'flex-col gap-8 sm:flex-row sm:gap-12' : 'gap-4')}>
      <div className="relative shrink-0" style={{ width: px, height: px }}>
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={theme.from} />
              <stop offset="100%" stopColor={theme.to} />
            </linearGradient>
          </defs>
          <Arc r={44} stroke={10} value={p} color={theme.from} gradId={id} delay={0.1} />
          <Arc r={31} stroke={10} value={dayFrac} color={theme.to} delay={0.2} />
          <Arc r={18} stroke={10} value={secFrac} color="#ff9f0a" delay={0.3} />
        </svg>
      </div>
      {lg ? (
        <div className="flex w-full flex-col gap-6">
          <BigDays t={t} className="text-[clamp(56px,12vw,104px)]" />
          <div className="grid grid-cols-3 gap-3">
            {legend.map(([c, l, v]) => (
              <div key={l} className="rounded-control bg-text-1/[0.04] p-3">
                <span className="flex items-center gap-1.5 font-ui text-12 font-semibold uppercase tracking-wide text-text-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: c }} />
                  {l}
                </span>
                <span className="mt-1 block font-ui text-17 font-semibold tabular-nums">{v}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex min-w-0 flex-col gap-1">
          <BigDays t={t} className="text-[40px]" />
          <Clock t={t} className="text-15" />
        </div>
      )}
    </div>
  );
}

/* ───────────── Barra ───────────── */
function BarViz({ t, p, theme, size }) {
  const lg = size === 'lg';
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-2">
        <BigDays t={t} className={lg ? 'text-[clamp(56px,12vw,104px)]' : 'text-[40px]'} />
        <Clock t={t} className={lg ? 'text-22' : 'text-15'} />
      </div>
      <div className={cn('relative overflow-hidden rounded-full bg-text-1/[0.06]', lg ? 'h-14' : 'h-3')}>
        <motion.div
          className="absolute inset-y-0 left-0 overflow-hidden rounded-full"
          style={{ background: `linear-gradient(90deg, ${theme.from}, ${theme.to})` }}
          initial={{ width: '0%' }}
          animate={{ width: `${Math.max(p * 100, lg ? 8 : 4)}%` }}
          transition={{ duration: 1.6, ease: easeOutExpo }}
        >
          <span
            className="absolute inset-y-0 w-1/3"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)', animation: 'shimmer 2.4s ease-in-out infinite' }}
          />
          {lg && (
            <span className="absolute inset-y-0 right-4 flex items-center font-ui text-15 font-semibold tabular-nums text-white">
              {Math.round(p * 100)}%
            </span>
          )}
        </motion.div>
      </div>
      {lg && (
        <div className="flex justify-between font-ui text-12 font-semibold uppercase tracking-wide text-text-3">
          <span>Inicio</span>
          <span>Meta</span>
        </div>
      )}
    </div>
  );
}

/* ───────────── Puntitos ───────────── */
function lerpColor(a, b, k) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * k)).join(',')})`;
}

function DotsViz({ t, p, theme, size, item }) {
  const lg = size === 'lg';
  const max = lg ? 180 : 56;
  const spanDays = Math.ceil((item.target - item.createdAt) / DAY);
  const perDay = spanDays >= 7 && spanDays <= max;
  const n = perDay ? spanDays : lg ? 100 : 56;
  const filled = Math.min(n, Math.floor(p * n));

  return (
    <div className="flex flex-col gap-3">
      <div className={cn('grid', lg ? 'gap-1.5 sm:gap-2' : 'gap-1')} style={{ gridTemplateColumns: `repeat(${lg ? 'auto-fill, minmax(14px, 1fr)' : '14, minmax(0, 1fr)'})` }}>
        {Array.from({ length: n }, (_, i) => {
          const on = i < filled;
          const current = i === filled;
          return (
            <motion.span
              key={i}
              className="relative aspect-square rounded-full"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ ...springSoft, delay: 0.15 + i * (lg ? 0.006 : 0.01) }}
              style={{ background: on ? lerpColor(theme.from, theme.to, i / n) : 'rgba(0,0,0,0.07)' }}
            >
              {current && (
                <motion.span
                  className="absolute inset-0 rounded-full"
                  style={{ background: theme.from }}
                  animate={{ scale: [0.6, 1.1, 0.6], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}
            </motion.span>
          );
        })}
      </div>
      <div className="flex items-end justify-between gap-2">
        <BigDays t={t} className={lg ? 'text-[clamp(48px,10vw,88px)]' : 'text-[32px]'} />
        <span className="font-ui text-12 font-semibold text-text-3">{perDay ? '1 punto = 1 día' : '1 punto = 1 %'}</span>
      </div>
    </div>
  );
}

/* ───────────── Columnas (ecualizador) ───────────── */
function ColumnsViz({ t, theme, size, item }) {
  const lg = size === 'lg';
  const spanDays = Math.max(1, Math.ceil((item.target - item.createdAt) / DAY));
  const cols = [
    ['Días', t.days, t.days / spanDays],
    ['Horas', pad(t.hours), t.hours / 24],
    ['Min', pad(t.minutes), t.minutes / 60],
    ['Seg', pad(t.seconds), t.seconds / 60],
  ];
  return (
    <div className={cn('grid grid-cols-4', lg ? 'gap-3 sm:gap-5' : 'gap-2')}>
      {cols.map(([label, v, frac], i) => (
        <div key={label} className="flex min-w-0 flex-col items-center gap-2">
          <NumericText value={v} className={cn('font-ui font-semibold leading-none tracking-tight', lg ? 'text-[clamp(28px,6vw,52px)]' : 'text-17')} />
          <div className={cn('relative w-full overflow-hidden bg-text-1/[0.05]', lg ? 'h-[clamp(140px,28vw,220px)] rounded-[20px]' : 'h-16 rounded-[10px]')}>
            <motion.div
              className="absolute inset-x-0 bottom-0"
              style={{ background: `linear-gradient(0deg, ${theme.from}, ${theme.to})`, borderRadius: lg ? 20 : 10 }}
              initial={{ height: '0%' }}
              animate={{ height: `${Math.max(4, Math.min(1, frac) * 100)}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 20, delay: i * 0.06 }}
            >
              <span className="absolute inset-x-2 top-1.5 h-1 rounded-full bg-white/50" />
            </motion.div>
          </div>
          <span className={cn('font-ui font-semibold uppercase tracking-wide text-text-2', lg ? 'text-12 sm:text-13' : 'text-[10px]')}>{label}</span>
        </div>
      ))}
    </div>
  );
}

/* ───────────── Arco (medidor) ───────────── */
function ArcViz({ t, p, theme, size }) {
  const lg = size === 'lg';
  const n = lg ? 48 : 32;
  const lit = Math.round(p * (n - 1));
  const polar = (deg, r) => [100 + r * Math.cos((deg * Math.PI) / 180), 100 + r * Math.sin((deg * Math.PI) / 180)];
  const knobDeg = 180 + p * 180;
  const [kx, ky] = polar(knobDeg, 70);
  const gauge = (
    <svg viewBox="0 0 200 108" className={cn('overflow-visible', lg ? 'w-full max-w-[440px]' : 'w-36 shrink-0')}>
      {Array.from({ length: n }, (_, i) => {
        const deg = 180 + (i / (n - 1)) * 180;
        const [x1, y1] = polar(deg, 80);
        const [x2, y2] = polar(deg, i % 4 === 0 ? 98 : 94);
        const on = i <= lit;
        return (
          <motion.line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            strokeWidth={lg ? 3.2 : 4.5}
            strokeLinecap="round"
            initial={{ opacity: 0, stroke: 'rgba(0,0,0,0.1)' }}
            animate={{
              opacity: 1,
              stroke: on ? lerpColor(theme.from, theme.to, i / (n - 1)) : 'rgba(0,0,0,0.1)',
            }}
            transition={{ duration: 0.3, delay: 0.1 + i * 0.02 }}
          />
        );
      })}
      <path d="M 40 100 A 60 60 0 0 1 160 100" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="2" strokeDasharray="2 4" />
      <motion.circle
        r={lg ? 6 : 9}
        fill="#fff"
        stroke={theme.from}
        strokeWidth={lg ? 3 : 4}
        initial={{ cx: 30, cy: 100 }}
        animate={{ cx: kx, cy: ky }}
        transition={{ type: 'spring', stiffness: 60, damping: 16, delay: 0.3 }}
      />
    </svg>
  );
  if (lg) {
    return (
      <div className="flex flex-col items-center">
        {gauge}
        <div className="-mt-[clamp(40px,10vw,96px)] flex flex-col items-center">
          <BigDays t={t} className="text-[clamp(48px,11vw,96px)]" />
          <Clock t={t} className="mt-1 text-22" />
          <span className="mt-2 font-ui text-13 font-semibold tabular-nums text-text-3">{Math.round(p * 100)}% del camino</span>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-4">
      {gauge}
      <div className="flex min-w-0 flex-col gap-1">
        <BigDays t={t} className="text-[40px]" />
        <Clock t={t} className="text-15" />
      </div>
    </div>
  );
}

/* ───────────── Semanas (calendario) ───────────── */
function WeeksViz({ t, theme, size, item }) {
  const lg = size === 'lg';
  const now = item.target - t.total;
  const maxWeeks = lg ? 26 : 14;
  const startDay = Math.floor(item.createdAt / DAY);
  const endDay = Math.ceil(item.target / DAY);
  const windowStart = Math.max(startDay, endDay - maxWeeks * 7);
  const today = Math.floor(now / DAY);
  const total = Math.max(7, endDay - windowStart);
  const weeks = Math.ceil(total / 7);

  return (
    <div className="flex flex-col gap-3">
      <div
        className="grid grid-flow-col"
        style={{ gridTemplateRows: 'repeat(7, minmax(0, 1fr))', gridTemplateColumns: `repeat(${weeks}, minmax(0, 1fr))`, gap: lg ? 5 : 3 }}
      >
        {Array.from({ length: weeks * 7 }, (_, i) => {
          const day = windowStart + i;
          const exists = day < endDay;
          const past = day < today;
          const isToday = day === today;
          const isGoal = day === endDay - 1;
          return (
            <motion.span
              key={i}
              className="relative aspect-square"
              style={{
                borderRadius: lg ? 4 : 3,
                background: !exists ? 'transparent' : past ? lerpColor(theme.from, theme.to, i / (weeks * 7)) : 'rgba(0,0,0,0.07)',
                boxShadow: isGoal ? `inset 0 0 0 2px ${theme.to}` : undefined,
              }}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ ...springSoft, delay: 0.1 + Math.floor(i / 7) * 0.03 + (i % 7) * 0.01 }}
            >
              {isToday && (
                <motion.span
                  className="absolute inset-0"
                  style={{ borderRadius: 'inherit', background: theme.from }}
                  animate={{ opacity: [0.35, 1, 0.35] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                />
              )}
            </motion.span>
          );
        })}
      </div>
      <div className="flex items-end justify-between gap-2">
        <BigDays t={t} className={lg ? 'text-[clamp(48px,10vw,88px)]' : 'text-[32px]'} />
        <span className="font-ui text-12 font-semibold text-text-3">{lg ? 'Cada cuadro es un día · la meta va enmarcada' : '1 cuadro = 1 día'}</span>
      </div>
    </div>
  );
}

const VIZ = { digits: DigitsViz, rings: RingsViz, bar: BarViz, dots: DotsViz, columns: ColumnsViz, arc: ArcViz, weeks: WeeksViz };
