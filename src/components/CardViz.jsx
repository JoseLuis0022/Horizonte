import { memo, useId } from 'react';
import { motion } from 'framer-motion';
import { NumericText } from './NumericText';
import { DAY, pad } from '../lib/time';
import { cn } from '../lib/cn';
import { easeOutExpo } from '../lib/motion';
import { fitGrid, shapeOf, useBox } from '../lib/grid';
import { Arc, ArcTicks, SecondHand, lerpColor, localDay } from './Visualizer';

// Visualizaciones de las tarjetas del grid. A diferencia de <Visualizer>
// (Hero, detalle, vista previa), aquí el contenido mide su espacio real y se
// compone según la forma de la tarjeta: chica, ancha, alta o grande. Los
// números siempre son lo más prominente.

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const shortFmt = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short' });
const fmtShort = (ts) => shortFmt.format(ts).replace('.', '');
const numFmt = new Intl.NumberFormat('es-MX');
// Entrada de puntos y cuadros en CSS (compositor), no un spring de JS por
// cada uno: con 200 elementos por tarjeta, en móvil la diferencia se nota.
const POP = 'cubic-bezier(0.34, 1.56, 0.64, 1)';

export function CardViz({ style = 'digits', ...props }) {
  const [ref, box] = useBox();
  const Comp = CARD_VIZ[style] ?? DigitsCard;
  return (
    <div ref={ref} className="relative h-full w-full">
      {box.w > 0 && (
        <motion.div
          key={style}
          className="absolute inset-0"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <Comp {...props} box={box} shape={shapeOf(box)} />
        </motion.div>
      )}
    </div>
  );
}

/* ───────────── Piezas comunes ───────────── */

// Valor principal: días; con menos de un día, horas; con menos de una hora, minutos.
function lead(t) {
  if (t.days > 0) return [t.days, t.days === 1 ? 'día' : 'días'];
  if (t.hours > 0) return [t.hours, t.hours === 1 ? 'hora' : 'horas'];
  return [t.minutes, 'min'];
}

function Big({ value, fs, className }) {
  return (
    <span style={{ fontSize: fs }} className={cn('font-ui font-semibold leading-[0.92] tracking-[-0.035em]', className)}>
      <NumericText value={value} />
    </span>
  );
}

function Clock({ t, fs }) {
  return (
    <span style={{ fontSize: fs }} className="flex items-center font-ui font-medium text-text-2">
      <NumericText value={pad(t.hours)} />
      <span className="px-[0.12em] opacity-50">:</span>
      <NumericText value={pad(t.minutes)} />
      <span className="px-[0.12em] opacity-50">:</span>
      <NumericText value={pad(t.seconds)} className="text-text-1" />
    </span>
  );
}

function Readout({ t, fs, align = 'start', clock = true, value, unit }) {
  const [v, u] = value != null ? [value, unit] : lead(t);
  return (
    <div className={cn('flex min-w-0 flex-col', align === 'center' && 'items-center', align === 'end' && 'items-end')}>
      <span className="flex items-baseline gap-[0.25em]" style={{ fontSize: clamp(fs * 0.2, 13, 22) }}>
        <Big value={v} fs={fs} />
        <span className="font-ui font-medium text-text-2">{u}</span>
      </span>
      {clock && (
        <span style={{ marginTop: clamp(fs * 0.1, 4, 12) }}>
          <Clock t={t} fs={clamp(fs * 0.28, 14, 30)} />
        </span>
      )}
    </div>
  );
}

// Fila de datos extra para tarjetas grandes.
function Stats({ items }) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
      {items.map(([label, value]) => (
        <div key={label} className="min-w-0 rounded-control bg-text-1/[0.04] px-3 py-2.5">
          <span className="block truncate font-ui text-12 font-semibold uppercase tracking-wide text-text-3">{label}</span>
          <span className="mt-0.5 block truncate font-ui text-15 font-semibold tabular-nums">{value}</span>
        </div>
      ))}
    </div>
  );
}

const baseStats = (t, p, item) => [
  ['Progreso', `${Math.round(p * 100)} %`],
  ['Llega', fmtShort(item.target)],
  ['En horas', `${numFmt.format(Math.floor(t.total / 3_600_000))} h`],
];

/* ───────────── Números ───────────── */
const UNIT_LABELS = ['Días', 'Horas', 'Min', 'Seg'];

function DigitsCard({ t, p, item, theme, box, shape }) {
  const values = [t.days, pad(t.hours), pad(t.minutes), pad(t.seconds)];

  if (shape === 'lg') {
    // Días enormes arriba, horas/min/seg debajo y datos extra al pie.
    const stats = box.h > 300;
    const usable = box.h - (stats ? 86 : 0);
    const dfs = Math.min(box.w * 0.3, usable * 0.5);
    const sfs = Math.min((box.w / 3) * 0.42, usable * 0.24);
    return (
      <div className="flex h-full flex-col justify-end gap-5">
        <Readout t={t} fs={dfs} value={t.days} unit={t.days === 1 ? 'día' : 'días'} clock={false} />
        <div className="grid grid-cols-3 gap-3">
          {values.slice(1).map((v, i) => (
            <div key={i} className="flex min-w-0 flex-col">
              <Big value={v} fs={sfs} className={i === 2 ? '' : 'text-text-1/80'} />
              <span className="mt-1.5 flex items-center gap-1.5 font-ui text-12 font-semibold uppercase tracking-wide text-text-2">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: i === 2 ? theme.to : theme.from }} />
                {UNIT_LABELS[i + 1]}
              </span>
            </div>
          ))}
        </div>
        {stats && <Stats items={baseStats(t, p, item)} />}
      </div>
    );
  }

  if (shape === 'wide') {
    const fs = Math.min((box.w / 4) * 0.52, box.h * 0.56);
    return (
      <div className="flex h-full flex-col justify-end">
        <div className="grid grid-cols-4 gap-x-3">
          {values.map((v, i) => (
            <div key={i} className="flex min-w-0 flex-col">
              <Big value={v} fs={fs} />
              <span className="mt-2 flex items-center gap-1.5 font-ui text-12 font-semibold uppercase tracking-wide text-text-2">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: i === 3 ? theme.to : theme.from }} />
                {UNIT_LABELS[i]}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (shape === 'tall') {
    const fs = Math.min(box.w * 0.34, (box.h / 4) * 0.62);
    return (
      <div className="flex h-full flex-col justify-end" style={{ gap: fs * 0.18 }}>
        {values.map((v, i) => (
          <div key={i} className="flex items-baseline gap-2">
            <Big value={v} fs={fs} className={i === 0 ? '' : 'text-text-1/80'} />
            <span className="font-ui text-12 font-semibold uppercase tracking-wide text-text-2">{UNIT_LABELS[i]}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col justify-end">
      <Readout t={t} fs={Math.min(box.w * 0.4, box.h * 0.6, 150)} />
    </div>
  );
}

/* ───────────── Puntitos ───────────── */
function DotsCard({ t, p, item, theme, box, shape }) {
  const big = shape === 'lg' || box.w * box.h > 140_000;
  const spanDays = Math.ceil((item.target - item.createdAt) / DAY);
  const maxN = big ? 200 : 70;
  const perDay = spanDays >= 7 && spanDays <= maxN;
  const n = perDay ? spanDays : big ? 100 : 50;
  const filled = Math.min(n, Math.floor(p * n));
  const legend = <span className="font-ui text-12 font-semibold text-text-3">{perDay ? '1 punto = 1 día' : '1 punto = 1 %'}</span>;
  const field = <DotField n={n} filled={filled} from={theme.from} to={theme.to} />;

  if (shape === 'wide') {
    return (
      <div className="flex h-full items-end gap-5">
        <div className="h-full min-w-0 flex-[1.2]">{field}</div>
        <div className="flex min-w-0 flex-1 flex-col items-end justify-end gap-2">
          <Readout t={t} fs={Math.min(box.w * 0.17, box.h * 0.5)} align="end" />
          {legend}
        </div>
      </div>
    );
  }
  const fs = shape === 'lg' ? Math.min(box.w * 0.16, box.h * 0.2) : shape === 'tall' ? Math.min(box.w * 0.36, box.h * 0.17) : Math.min(box.w * 0.3, box.h * 0.32);
  return (
    <div className="flex h-full flex-col gap-3">
      <div className="min-h-0 flex-1">{field}</div>
      <div className="flex items-end justify-between gap-2">
        <Readout t={t} fs={fs} />
        {legend}
      </div>
      {shape === 'lg' && box.h > 420 && <Stats items={baseStats(t, p, item)} />}
    </div>
  );
}

// La cuadrícula mide su propio espacio y elige el punto más grande que cabe.
const DotField = memo(function DotField({ n, filled, from, to }) {
  const [ref, box] = useBox();
  const { cols, cell } = fitGrid(n, box.w, box.h, 0.45, 30);
  return (
    <div ref={ref} className="flex h-full w-full items-center justify-center">
      {cell > 0 && (
        <div className="grid" style={{ gridTemplateColumns: `repeat(${cols}, ${cell}px)`, gap: cell * 0.45 }}>
          {Array.from({ length: n }, (_, i) => {
            const on = i < filled;
            return (
              <span
                key={i}
                className="relative rounded-full"
                style={{ width: cell, height: cell, background: on ? lerpColor(from, to, i / n) : 'rgba(0,0,0,0.07)', animation: `pop-in 0.5s ${POP} ${0.1 + i * 0.004}s both` }}
              >
                {i === filled && <span className="absolute inset-0 rounded-full" style={{ background: from, animation: 'pulse-dot 1.4s ease-in-out infinite' }} />}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
});

/* ───────────── Semanas ───────────── */
function WeeksCard({ t, p, item, theme, box, shape }) {
  const now = item.target - t.total;
  const big = shape === 'lg' || shape === 'tall';
  const maxWeeks = big ? 26 : 16;
  const startDay = Math.floor(localDay(item.createdAt));
  const endDay = Math.ceil(localDay(item.target));
  const windowStart = Math.max(startDay, endDay - maxWeeks * 7);
  const today = Math.floor(localDay(now));
  const w = Math.floor(t.days / 7);
  const d = t.days % 7;
  const fs = shape === 'lg' ? Math.min(box.w * 0.13, box.h * 0.17) : shape === 'tall' ? Math.min(box.w * 0.24, box.h * 0.13) : shape === 'wide' ? Math.min(box.w * 0.1, box.h * 0.4) : Math.min(box.w * 0.12, box.h * 0.32);

  const readout = (
    <div className="flex min-w-0 flex-col">
      <span className="flex items-baseline gap-[0.25em]" style={{ fontSize: clamp(fs * 0.24, 13, 22) }}>
        {w > 0 && (
          <>
            <Big value={w} fs={fs} />
            <span className="mr-[0.3em] font-ui font-medium text-text-2">{w === 1 ? 'sem' : 'sems'}</span>
          </>
        )}
        <Big value={t.days > 0 || w > 0 ? d : lead(t)[0]} fs={fs} />
        <span className="font-ui font-medium text-text-2">{t.days > 0 || w > 0 ? (d === 1 ? 'día' : 'días') : lead(t)[1]}</span>
      </span>
      <span style={{ marginTop: clamp(fs * 0.12, 4, 12) }}>
        <Clock t={t} fs={clamp(fs * 0.3, 14, 28)} />
      </span>
    </div>
  );
  const field = <WeekField windowStart={windowStart} endDay={endDay} today={today} from={theme.from} to={theme.to} />;

  // En chica y ancha el calendario va a la izquierda: así los cuadros crecen.
  if (shape === 'wide' || shape === 'sm') {
    return (
      <div className={cn('flex h-full items-end', shape === 'sm' ? 'gap-3' : 'gap-5')}>
        <div className="h-full min-w-0 flex-[1.3]">{field}</div>
        <div className="flex min-w-0 flex-1 flex-col items-end justify-end gap-2">
          {readout}
          <span className="font-ui text-12 font-semibold text-text-3">1 cuadro = 1 día</span>
        </div>
      </div>
    );
  }
  return (
    <div className="flex h-full flex-col gap-3">
      <div className="min-h-0 flex-1">{field}</div>
      <div className="flex items-end justify-between gap-2">
        {readout}
        <span className="text-right font-ui text-12 font-semibold text-text-3">1 cuadro = 1 día</span>
      </div>
      {shape === 'lg' && box.h > 440 && <Stats items={baseStats(t, p, item)} />}
    </div>
  );
}

const WEEKDAYS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

// Elige entre calendario (filas = semanas) y mapa tipo GitHub (columnas =
// semanas), el que deje los cuadros más grandes en el espacio disponible.
const WeekField = memo(function WeekField({ windowStart, endDay, today, from, to }) {
  const [ref, box] = useBox();
  const offset = new Date(windowStart * DAY).getUTCDay();
  const calWeeks = Math.ceil((offset + endDay - windowStart) / 7);
  const mapWeeks = Math.ceil((endDay - windowStart) / 7);
  const g = 0.25;
  const head = 18;
  const calCell = Math.min(box.w / (7 + 6 * g), (box.h - head) / (calWeeks + (calWeeks - 1) * g), 40);
  const mapCell = Math.min(box.w / (mapWeeks + (mapWeeks - 1) * g), box.h / (7 + 6 * g), 30);
  const calendar = calCell >= mapCell;
  const cell = Math.max(0, Math.floor(calendar ? calCell : mapCell));
  const count = calendar ? calWeeks * 7 : mapWeeks * 7;
  const start = calendar ? windowStart - offset : windowStart;

  return (
    <div ref={ref} className="flex h-full w-full flex-col items-center justify-center gap-1">
      {cell > 0 && calendar && (
        <div className="grid" style={{ gridTemplateColumns: `repeat(7, ${cell}px)`, gap: cell * g }}>
          {WEEKDAYS.map((wd, i) => (
            <span key={i} className="text-center font-ui text-[11px] font-semibold leading-[14px] text-text-3">
              {wd}
            </span>
          ))}
        </div>
      )}
      {cell > 0 && (
        <div
          className={cn('grid', !calendar && 'grid-flow-col')}
          style={calendar ? { gridTemplateColumns: `repeat(7, ${cell}px)`, gap: cell * g } : { gridTemplateRows: `repeat(7, ${cell}px)`, gridAutoColumns: `${cell}px`, gap: cell * g }}
        >
          {Array.from({ length: count }, (_, i) => {
            const day = start + i;
            const exists = day >= windowStart && day < endDay;
            const isToday = day === today;
            return (
              <span
                key={i}
                className="relative"
                style={{
                  width: cell,
                  height: cell,
                  borderRadius: cell * 0.28,
                  background: !exists ? 'transparent' : day < today ? lerpColor(from, to, i / count) : 'rgba(0,0,0,0.07)',
                  boxShadow: exists && day === endDay - 1 ? `inset 0 0 0 2px ${to}` : undefined,
                  animation: `pop-in 0.5s ${POP} ${0.1 + i * 0.005}s both`,
                }}
              >
                {exists && isToday && <span className="absolute inset-0" style={{ borderRadius: 'inherit', background: from, animation: 'pulse-cell 1.4s ease-in-out infinite' }} />}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
});

/* ───────────── Anillos ───────────── */
function RingsGraphic({ t, p, theme, px }) {
  const id = useId();
  return (
    <div className="relative shrink-0" style={{ width: px, height: px }}>
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={theme.from} />
            <stop offset="100%" stopColor={theme.to} />
          </linearGradient>
        </defs>
        <Arc r={44} stroke={10} value={p} color={theme.from} gradId={id} delay={0.1} />
        <Arc r={31} stroke={10} value={1 - (t.hours * 60 + t.minutes) / 1440} color={theme.to} delay={0.2} />
        <Arc r={18} stroke={10} value={1 - t.seconds / 60} color="#ff9f0a" delay={0.3} />
      </svg>
    </div>
  );
}

function RingsLegend({ t, p, theme, compact }) {
  const rows = [
    [theme.from, 'Total', `${Math.round(p * 100)} %`],
    [theme.to, 'Día', `${pad(t.hours)}:${pad(t.minutes)}`],
    ['#ff9f0a', 'Minuto', `${pad(t.seconds)} s`],
  ];
  return (
    <div className={cn('grid gap-2', compact ? 'grid-cols-1' : 'grid-cols-3')}>
      {rows.map(([c, l, v]) => (
        <div key={l} className={cn('flex min-w-0 rounded-control bg-text-1/[0.04]', compact ? 'items-center justify-between gap-3 px-3 py-1.5' : 'flex-col px-3 py-2.5')}>
          <span className="flex items-center gap-1.5 font-ui text-12 font-semibold uppercase tracking-wide text-text-2">
            <span className="h-2 w-2 rounded-full" style={{ background: c }} />
            {l}
          </span>
          <span className="font-ui text-15 font-semibold tabular-nums">{v}</span>
        </div>
      ))}
    </div>
  );
}

function RingsCard({ t, p, theme, box, shape }) {
  if (shape === 'tall') {
    const px = Math.min(box.w, box.h * 0.5);
    return (
      <div className="flex h-full flex-col justify-between gap-3">
        <div className="flex flex-1 items-center justify-center">
          <RingsGraphic t={t} p={p} theme={theme} px={px} />
        </div>
        <Readout t={t} fs={Math.min(box.w * 0.34, box.h * 0.15)} />
        {box.h > 420 && <RingsLegend t={t} p={p} theme={theme} compact />}
      </div>
    );
  }
  if (shape === 'lg') {
    const row = box.w / box.h > 1.15;
    const px = row ? Math.min(box.h * 0.92, box.w * 0.48) : Math.min(box.w * 0.8, box.h * 0.5);
    return (
      <div className={cn('flex h-full gap-6', row ? 'items-center' : 'flex-col items-center justify-between')}>
        <RingsGraphic t={t} p={p} theme={theme} px={px} />
        <div className={cn('flex min-w-0 flex-1 flex-col justify-center gap-5', !row && 'w-full')}>
          <Readout t={t} fs={row ? Math.min((box.w - px) * 0.3, box.h * 0.24) : Math.min(box.w * 0.18, box.h * 0.16)} />
          <RingsLegend t={t} p={p} theme={theme} compact={row && box.w - px < 420} />
        </div>
      </div>
    );
  }
  const px = Math.min(box.h, box.w * (shape === 'wide' ? 0.3 : 0.46));
  return (
    <div className="flex h-full items-end gap-4">
      <RingsGraphic t={t} p={p} theme={theme} px={px} />
      <div className="flex min-w-0 flex-1 items-end justify-between gap-4">
        <Readout t={t} fs={Math.min((box.w - px) * (shape === 'wide' ? 0.22 : 0.36), box.h * 0.5)} />
        {shape === 'wide' && box.w > 480 && (
          <div className="w-44 shrink-0">
            <RingsLegend t={t} p={p} theme={theme} compact />
          </div>
        )}
      </div>
    </div>
  );
}

/* ───────────── Barra ───────────── */
function Bar({ p, theme, thick, ticks, vertical }) {
  const pct = Math.max(p * 100, 3);
  return (
    <div
      className="relative overflow-hidden rounded-full bg-text-1/[0.06]"
      style={vertical ? { width: thick, height: '100%' } : { height: thick, width: '100%' }}
    >
      <motion.div
        className={cn('absolute overflow-hidden rounded-full', vertical ? 'inset-x-0 bottom-0' : 'inset-y-0 left-0')}
        style={{ background: `linear-gradient(${vertical ? '0deg' : '90deg'}, ${theme.from}, ${theme.to})` }}
        initial={vertical ? { height: '0%' } : { width: '0%' }}
        animate={vertical ? { height: `${pct}%` } : { width: `${pct}%` }}
        transition={{ duration: 1.4, ease: easeOutExpo }}
      >
        {!vertical && (
          <span className="absolute inset-y-0 w-1/3" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)', animation: 'shimmer 2.4s ease-in-out infinite' }} />
        )}
      </motion.div>
      {ticks &&
        [25, 50, 75].map((x) => (
          <span key={x} className="absolute inset-y-[22%] w-px bg-white/70 mix-blend-overlay" style={{ left: `${x}%` }} />
        ))}
    </div>
  );
}

function BarCard({ t, p, item, theme, box, shape }) {
  const pct = Math.round(p * 100);
  const total = Math.max(1, Math.round((item.target - item.createdAt) / DAY));
  const elapsed = Math.min(total, Math.round((item.target - t.total - item.createdAt) / DAY));

  if (shape === 'tall') {
    return (
      <div className="flex h-full gap-4">
        <Bar p={p} theme={theme} thick={clamp(box.w * 0.13, 14, 36)} vertical />
        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <div>
            <Big value={pct} fs={Math.min(box.w * 0.28, box.h * 0.12)} />
            <span className="ml-1 font-ui text-15 font-medium text-text-2">%</span>
            <p className="mt-1 font-ui text-12 font-semibold text-text-3">Meta · {fmtShort(item.target)}</p>
          </div>
          <Readout t={t} fs={Math.min(box.w * 0.3, box.h * 0.14)} />
        </div>
      </div>
    );
  }

  if (shape === 'lg' || shape === 'wide') {
    const lg = shape === 'lg';
    const fs = lg ? Math.min(box.w * 0.2, box.h * 0.28) : Math.min(box.w * 0.12, box.h * 0.4);
    return (
      <div className="flex h-full flex-col justify-end gap-3">
        <div className="flex items-end justify-between gap-4">
          <Readout t={t} fs={fs} />
          <span className="flex items-baseline gap-1 pb-1">
            <Big value={pct} fs={fs * 0.55} className="text-text-1/80" />
            <span className="font-ui text-15 font-medium text-text-2">%</span>
          </span>
        </div>
        <Bar p={p} theme={theme} thick={lg ? clamp(box.h * 0.09, 20, 56) : clamp(box.h * 0.1, 12, 22)} ticks />
        <div className="flex justify-between font-ui text-12 font-semibold text-text-3">
          <span>Inicio · {fmtShort(item.createdAt)}</span>
          <span>Meta · {fmtShort(item.target)}</span>
        </div>
        {lg && box.h > 340 && (
          <Stats
            items={[
              ['Transcurridos', `${elapsed} ${elapsed === 1 ? 'día' : 'días'}`],
              ['Faltan', `${t.days} ${t.days === 1 ? 'día' : 'días'}`],
              ['Total', `${total} ${total === 1 ? 'día' : 'días'}`],
            ]}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col justify-end gap-2.5">
      <Readout t={t} fs={Math.min(box.w * 0.34, box.h * 0.42)} />
      <Bar p={p} theme={theme} thick={clamp(box.h * 0.08, 8, 14)} />
      <div className="flex justify-between font-ui text-12 font-semibold text-text-3">
        <span className="tabular-nums">{pct} %</span>
        <span>Meta · {fmtShort(item.target)}</span>
      </div>
    </div>
  );
}

/* ───────────── Columnas ───────────── */
function ColumnsCard({ t, item, theme, box }) {
  const spanDays = Math.max(1, Math.ceil((item.target - item.createdAt) / DAY));
  const cols = [
    ['Días', t.days, t.days / spanDays],
    ['Horas', pad(t.hours), t.hours / 24],
    ['Min', pad(t.minutes), t.minutes / 60],
    ['Seg', pad(t.seconds), t.seconds / 60],
  ];
  const colW = box.w / 4;
  const fs = Math.min(colW * 0.48, box.h * 0.2);
  const r = clamp(colW * 0.16, 8, 22);
  return (
    <div className="grid h-full grid-cols-4" style={{ gap: clamp(colW * 0.1, 6, 20) }}>
      {cols.map(([label, v, frac], i) => (
        <div key={label} className="flex min-h-0 min-w-0 flex-col items-center gap-2">
          <Big value={v} fs={fs} />
          <div className="relative w-full min-h-0 flex-1 overflow-hidden bg-text-1/[0.05]" style={{ borderRadius: r }}>
            <motion.div
              className="absolute inset-0"
              style={{ background: `linear-gradient(0deg, ${theme.from}, ${theme.to})`, borderRadius: r }}
              initial={{ transform: 'translateY(100%)' }}
              animate={{ transform: `translateY(${100 - Math.max(4, Math.min(1, frac) * 100)}%)` }}
              transition={{ type: 'spring', stiffness: 120, damping: 20, delay: i * 0.06 }}
            >
              <span className="absolute inset-x-2 top-1.5 h-1 rounded-full bg-white/50" />
            </motion.div>
          </div>
          <span className="font-ui text-[11px] font-semibold uppercase tracking-wide text-text-2">{label}</span>
        </div>
      ))}
    </div>
  );
}

/* ───────────── Arco ───────────── */
function Gauge({ t, p, theme, width }) {
  const lg = width > 300;
  return (
    <svg viewBox="0 0 200 108" className="shrink-0 overflow-visible" style={{ width, height: width * 0.54 }}>
      <ArcTicks p={p} from={theme.from} to={theme.to} lg={lg} />
      <SecondHand seconds={t.done ? 0 : t.seconds} color={theme.to} lg={lg} />
    </svg>
  );
}

function ArcCard({ t, p, theme, box, shape }) {
  if (shape === 'wide' || (shape === 'sm' && box.w / box.h > 1.45)) {
    const gw = Math.min(box.h * 1.7, box.w * 0.5);
    return (
      <div className="flex h-full items-end gap-4">
        <Gauge t={t} p={p} theme={theme} width={gw} />
        <Readout t={t} fs={Math.min((box.w - gw) * 0.3, box.h * 0.5)} />
      </div>
    );
  }
  const gw = Math.min(box.w, box.h * (shape === 'lg' ? 1.25 : 1.15));
  const fs = Math.min(gw * 0.24, box.h * 0.3);
  return (
    <div className={cn('flex h-full flex-col items-center', shape === 'tall' ? 'justify-center' : 'justify-end')}>
      <Gauge t={t} p={p} theme={theme} width={gw} />
      <div className="flex flex-col items-center" style={{ marginTop: -gw * 0.2 }}>
        <Readout t={t} fs={fs} align="center" />
        {shape !== 'sm' && <span className="mt-2 font-ui text-13 font-semibold tabular-nums text-text-3">{Math.round(p * 100)} % del camino</span>}
      </div>
    </div>
  );
}

const CARD_VIZ = { digits: DigitsCard, dots: DotsCard, weeks: WeeksCard, rings: RingsCard, bar: BarCard, columns: ColumnsCard, arc: ArcCard };
