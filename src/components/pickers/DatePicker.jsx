import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../Button';
import { cn } from '../../lib/cn';
import { DAY, pad } from '../../lib/time';
import { spring, springSnappy, springSoft } from '../../lib/motion';

const WEEKDAYS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
const monthFmt = new Intl.DateTimeFormat('es-MX', { month: 'long' });

const toKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = (s) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

// Calendario propio: el mes entra deslizándose en la dirección de navegación,
// se puede cambiar de mes arrastrando, y la selección viaja con layoutId.
export function DatePicker({ value, onChange, onDone }) {
  const selected = value ? parse(value) : new Date();
  const [view, setView] = useState(() => new Date(selected.getFullYear(), selected.getMonth(), 1));
  const [dir, setDir] = useState(0);
  const todayKey = toKey(new Date());

  const go = (delta) => {
    setDir(delta);
    setView((v) => new Date(v.getFullYear(), v.getMonth() + delta, 1));
  };

  const first = view.getDay();
  const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: Math.ceil((first + daysInMonth) / 7) * 7 }, (_, i) => {
    const n = i - first + 1;
    return n >= 1 && n <= daysInMonth ? new Date(view.getFullYear(), view.getMonth(), n) : null;
  });

  const quick = [
    ['Hoy', 0],
    ['Mañana', 1],
    ['1 semana', 7],
    ['1 mes', 30],
  ];

  const pick = (d) => {
    onChange(toKey(d));
    if (d.getMonth() !== view.getMonth() || d.getFullYear() !== view.getFullYear()) {
      setDir(d > view ? 1 : -1);
      setView(new Date(d.getFullYear(), d.getMonth(), 1));
    }
  };

  const monthKey = `${view.getFullYear()}-${view.getMonth()}`;
  const monthName = monthFmt.format(view);

  return (
    <div className="p-5">
      <div className="flex items-center justify-between">
        <div className="relative h-8 flex-1 overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false} custom={dir}>
            <motion.h3
              key={monthKey}
              custom={dir}
              variants={{
                enter: (d) => ({ y: d >= 0 ? 20 : -20, opacity: 0, filter: 'blur(4px)' }),
                center: { y: 0, opacity: 1, filter: 'blur(0px)' },
                exit: (d) => ({ y: d >= 0 ? -20 : 20, opacity: 0, filter: 'blur(4px)' }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={spring}
              className="font-ui text-22"
            >
              {monthName.charAt(0).toUpperCase() + monthName.slice(1)} <span className="text-text-3">{view.getFullYear()}</span>
            </motion.h3>
          </AnimatePresence>
        </div>
        <div className="flex gap-1">
          {[
            [-1, ChevronLeft, 'Mes anterior'],
            [1, ChevronRight, 'Mes siguiente'],
          ].map(([d, Icon, label]) => (
            <motion.button
              key={d}
              type="button"
              aria-label={label}
              onClick={() => go(d)}
              whileTap={{ scale: 0.85 }}
              transition={springSnappy}
              className="flex h-10 w-10 items-center justify-center rounded-full text-accent transition-colors hover:bg-accent-soft"
            >
              <Icon size={22} />
            </motion.button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 text-center font-ui text-12 font-semibold text-text-3">
        {WEEKDAYS.map((w, i) => (
          <span key={i}>{w}</span>
        ))}
      </div>

      <div className="relative mt-2 overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false} custom={dir}>
          <motion.div
            key={monthKey}
            custom={dir}
            variants={{
              enter: (d) => ({ x: d >= 0 ? '60%' : '-60%', opacity: 0 }),
              center: { x: 0, opacity: 1 },
              exit: (d) => ({ x: d >= 0 ? '-60%' : '60%', opacity: 0 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={springSoft}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.25}
            onDragEnd={(_, info) => {
              if (info.offset.x < -50 || info.velocity.x < -400) go(1);
              else if (info.offset.x > 50 || info.velocity.x > 400) go(-1);
            }}
            className="grid cursor-grab grid-cols-7 gap-y-1 active:cursor-grabbing"
          >
            {cells.map((d, i) => {
              if (!d) return <span key={i} />;
              const key = toKey(d);
              const isSel = key === value;
              const isToday = key === todayKey;
              const isPast = key < todayKey;
              return (
                <motion.button
                  key={key}
                  type="button"
                  onClick={() => pick(d)}
                  whileTap={{ scale: 0.85 }}
                  transition={springSnappy}
                  className={cn(
                    'relative mx-auto flex h-10 w-10 items-center justify-center rounded-full font-ui text-17 tabular-nums transition-colors',
                    isSel ? 'font-semibold text-white' : isToday ? 'font-semibold text-accent' : isPast ? 'text-text-3' : 'text-text-1 hover:bg-text-1/[0.05]'
                  )}
                >
                  {isSel && <motion.span layoutId="date-sel" transition={spring} className="absolute inset-0 rounded-full bg-accent shadow-2" />}
                  <span className="relative">{d.getDate()}</span>
                </motion.button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar">
        {quick.map(([label, days]) => (
          <motion.button
            key={label}
            type="button"
            whileTap={{ scale: 0.94 }}
            transition={springSnappy}
            onClick={() => pick(new Date(Date.now() + days * DAY))}
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
