import { useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { NumericText } from '../NumericText';
import { Button } from '../Button';
import { pad } from '../../lib/time';
import { springSnappy } from '../../lib/motion';

const ITEM = 44;
const VISIBLE = 5;
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

// Rueda estilo iOS: scroll-snap nativo (inercia real del trackpad/dedo) y cada
// fila se curva en 3D según su distancia al centro.
function Wheel({ values, value, onChange, label }) {
  const ref = useRef(null);
  const { scrollY } = useScroll({ container: ref });
  const settle = useRef();

  useEffect(() => {
    const el = ref.current;
    const target = values.indexOf(value) * ITEM;
    if (el && Math.abs(el.scrollTop - target) > 2) el.scrollTo({ top: target, behavior: el.dataset.ready ? 'smooth' : 'auto' });
    if (el) el.dataset.ready = '1';
  }, [value, values]);

  const onScroll = () => {
    clearTimeout(settle.current);
    settle.current = setTimeout(() => {
      const i = Math.round(ref.current.scrollTop / ITEM);
      const v = values[Math.min(values.length - 1, Math.max(0, i))];
      if (v !== value) onChange(v);
    }, 90);
  };

  return (
    <div className="relative flex-1">
      <div
        ref={ref}
        onScroll={onScroll}
        aria-label={label}
        className="relative snap-y snap-mandatory overflow-y-scroll no-scrollbar [perspective:600px]"
        style={{ height: ITEM * VISIBLE, paddingBlock: (ITEM * (VISIBLE - 1)) / 2 }}
      >
        {values.map((v, i) => (
          <WheelItem key={v} index={i} scrollY={scrollY} active={v === value} onClick={() => onChange(v)}>
            {pad(v)}
          </WheelItem>
        ))}
      </div>
    </div>
  );
}

function WheelItem({ index, scrollY, active, onClick, children }) {
  const center = index * ITEM;
  const range = [center - ITEM * 3, center, center + ITEM * 3];
  const rotateX = useTransform(scrollY, range, [55, 0, -55]);
  const opacity = useTransform(scrollY, range, [0.15, 1, 0.15]);
  const scale = useTransform(scrollY, range, [0.82, 1, 0.82]);
  return (
    <motion.button
      type="button"
      onClick={onClick}
      style={{ height: ITEM, rotateX, opacity, scale }}
      className={`flex w-full snap-center items-center justify-center font-ui text-[26px] tabular-nums transition-[font-weight] ${active ? 'font-semibold text-text-1' : 'text-text-2'}`}
    >
      {children}
    </motion.button>
  );
}

const fmt12 = (h, m) => new Intl.DateTimeFormat('es-MX', { hour: 'numeric', minute: '2-digit' }).format(new Date(2000, 0, 1, h, m));

export function TimePicker({ value, onChange, onDone }) {
  const [h, m] = (value || '09:00').split(':').map(Number);
  const set = (nh, nm) => onChange(`${pad(nh)}:${pad(nm)}`);
  const quick = [
    ['Mañana', 9, 0],
    ['Mediodía', 12, 0],
    ['Tarde', 18, 0],
    ['Medianoche', 0, 0],
  ];

  return (
    <div className="p-5">
      <div className="flex flex-col items-center">
        <div className="flex items-center font-ui text-[56px] font-semibold leading-none tracking-tight">
          <NumericText value={pad(h)} />
          <motion.span animate={{ opacity: [1, 0.25, 1] }} transition={{ duration: 1.2, repeat: Infinity }} className="px-1 pb-2">
            :
          </motion.span>
          <NumericText value={pad(m)} />
        </div>
        <span className="mt-1 font-ui text-15 text-text-2">{fmt12(h, m)}</span>
      </div>

      <div className="relative mt-4 flex gap-2 rounded-card bg-text-1/[0.03] px-4">
        {/* banda de selección */}
        <div className="pointer-events-none absolute inset-x-2 top-1/2 h-11 -translate-y-1/2 rounded-control bg-surface-1 shadow-1" />
        <div className="relative z-10 flex flex-1 gap-2">
          <Wheel label="Horas" values={HOURS} value={h} onChange={(v) => set(v, m)} />
          <span className="flex items-center font-ui text-[26px] font-semibold text-text-3">:</span>
          <Wheel label="Minutos" values={MINUTES} value={m} onChange={(v) => set(h, v)} />
        </div>
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-16 rounded-t-card bg-gradient-to-b from-surface-1 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-16 rounded-b-card bg-gradient-to-t from-surface-1 to-transparent" />
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar">
        {quick.map(([label, qh, qm]) => (
          <motion.button
            key={label}
            type="button"
            whileTap={{ scale: 0.94 }}
            transition={springSnappy}
            onClick={() => set(qh, qm)}
            className="h-9 shrink-0 rounded-full bg-text-1/[0.05] px-4 font-ui text-13 font-semibold text-text-2 transition-colors hover:bg-accent-soft hover:text-accent"
          >
            {label}
          </motion.button>
        ))}
      </div>

      <Button type="button" className="mt-5 w-full" onClick={onDone}>
        Listo
      </Button>
    </div>
  );
}
