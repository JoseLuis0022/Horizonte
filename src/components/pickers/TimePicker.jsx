import { useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { NumericText } from '../NumericText';
import { Button } from '../Button';
import { pad } from '../../lib/time';
import { springSnappy } from '../../lib/motion';

const ITEM = 44;
const VISIBLE = 5;
const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const PERIODS = [0, 1]; // 0 = a.m., 1 = p.m.

// Rueda estilo iOS: scroll-snap nativo (inercia real del trackpad/dedo), cada
// fila se curva en 3D según su distancia al centro, y el valor se actualiza
// EN VIVO mientras se arrastra (no hasta soltar).
function Wheel({ values, value, onChange, label, format }) {
  const ref = useRef(null);
  const { scrollY } = useScroll({ container: ref });
  // Último valor emitido por el propio scroll: si el cambio vino de aquí no
  // hay que re-posicionar la rueda (pelearía con el dedo del usuario).
  const emitted = useRef(value);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (value === emitted.current && el.dataset.ready) return;
    emitted.current = value;
    const target = values.indexOf(value) * ITEM;
    el.scrollTo({ top: target, behavior: el.dataset.ready ? 'smooth' : 'auto' });
    el.dataset.ready = '1';
  }, [value, values]);

  const onScroll = () => {
    const i = Math.min(values.length - 1, Math.max(0, Math.round(ref.current.scrollTop / ITEM)));
    const v = values[i];
    if (v !== emitted.current) {
      emitted.current = v;
      onChange(v);
    }
  };

  return (
    <div
      ref={ref}
      onScroll={onScroll}
      aria-label={label}
      className="relative flex-1 snap-y snap-mandatory overflow-y-scroll no-scrollbar [perspective:600px]"
      style={{ height: ITEM * VISIBLE, paddingBlock: (ITEM * (VISIBLE - 1)) / 2 }}
    >
      {values.map((v, i) => (
        <WheelItem key={v} index={i} scrollY={scrollY} active={v === value} onClick={() => onChange(v)}>
          {format(v)}
        </WheelItem>
      ))}
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
      className={`flex w-full snap-center items-center justify-center font-ui text-[24px] tabular-nums ${active ? 'font-semibold text-text-1' : 'text-text-2'}`}
    >
      {children}
    </motion.button>
  );
}

// Formato de 12 horas. El valor externo sigue siendo "HH:MM" en 24 h.
export function TimePicker({ value, onChange, onDone }) {
  const [h24, m] = (value || '09:00').split(':').map(Number);
  const h12 = h24 % 12 || 12;
  const pm = h24 >= 12 ? 1 : 0;
  const set = (nh12, nm, npm) => onChange(`${pad((nh12 % 12) + (npm ? 12 : 0))}:${pad(nm)}`);
  const quick = [
    ['Mañana', 9, 0, 0],
    ['Mediodía', 12, 0, 1],
    ['Tarde', 6, 0, 1],
    ['Medianoche', 12, 0, 0],
  ];

  return (
    <div className="p-5">
      <div className="flex items-baseline justify-center gap-2">
        <div className="flex items-center font-ui text-[56px] font-semibold leading-none tracking-tight">
          <NumericText value={h12} />
          <span className="px-1 pb-2" style={{ animation: 'pulse-cell 1.2s ease-in-out infinite' }}>
            :
          </span>
          <NumericText value={pad(m)} />
        </div>
        <motion.span key={pm} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={springSnappy} className="font-ui text-22 text-text-2">
          {pm ? 'p.m.' : 'a.m.'}
        </motion.span>
      </div>

      <div className="relative mt-4 flex gap-1 rounded-card bg-text-1/[0.03] px-3">
        {/* banda de selección */}
        <div className="pointer-events-none absolute inset-x-2 top-1/2 h-11 -translate-y-1/2 rounded-control bg-surface-1 shadow-1" />
        <div className="relative z-10 flex flex-1 gap-1">
          <Wheel label="Hora" values={HOURS} value={h12} onChange={(v) => set(v, m, pm)} format={String} />
          <span className="flex items-center font-ui text-[24px] font-semibold text-text-3">:</span>
          <Wheel label="Minutos" values={MINUTES} value={m} onChange={(v) => set(h12, v, pm)} format={pad} />
          <Wheel label="a.m. / p.m." values={PERIODS} value={pm} onChange={(v) => set(h12, m, v)} format={(v) => (v ? 'p.m.' : 'a.m.')} />
        </div>
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-16 rounded-t-card bg-gradient-to-b from-surface-1 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-16 rounded-b-card bg-gradient-to-t from-surface-1 to-transparent" />
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar">
        {quick.map(([label, qh, qm, qpm]) => (
          <motion.button
            key={label}
            type="button"
            whileTap={{ scale: 0.94 }}
            transition={springSnappy}
            onClick={() => set(qh, qm, qpm)}
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
