import { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { EmojiTile } from './EmojiTile';
import { NumericText } from './NumericText';
import { Glyph } from './StylePicker';
import { STYLES } from '../lib/styles';
import { getTheme, gradient } from '../lib/themes';
import { DAY, pad, progress, relative } from '../lib/time';
import { useNowSelector } from '../lib/useNow';
import { easeOutExpo, springLayout, springSoft } from '../lib/motion';

// Columna lateral junto al Hero en pantallas anchas: los siguientes
// countdowns con su tiempo restante en vivo, el estilo con el que se
// cuentan y su progreso.
export function UpNext({ items, total, onOpen, onSeeAll }) {
  return (
    <motion.aside
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      transition={{ ...springSoft, delay: 0.15 }}
      aria-label="Después"
      className="flex w-full min-w-0 flex-col rounded-modal border border-hairline bg-surface-1 p-3 shadow-2"
    >
      <span className="px-3 pb-1 pt-2 font-ui text-12 font-semibold uppercase tracking-wide text-text-2">Después</span>
      <div className="flex flex-1 flex-col">
        {items.map((item, i) => (
          <div key={item.id} className="flex flex-1 flex-col justify-center">
            {i > 0 && <div className="mx-3 h-px bg-hairline" />}
            <UpNextRow item={item} onOpen={() => onOpen(item.id)} />
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onSeeAll}
        className="mx-1 mt-1 flex h-10 items-center justify-between rounded-control px-2 font-ui text-13 font-semibold text-accent transition-colors hover:bg-accent-soft"
      >
        Ver todos los countdowns
        <span className="flex items-center gap-0.5 tabular-nums">
          {total} <ChevronRight size={16} />
        </span>
      </button>
    </motion.aside>
  );
}

// La fila (con layoutId) no escucha el reloj; sus partes vivas sí.
const UpNextRow = memo(function UpNextRow({ item, onOpen }) {
  const theme = getTheme(item.theme);
  const styleName = STYLES.find((s) => s.key === (item.style ?? 'digits'))?.name;

  return (
    <motion.button
      layoutId={`upnext-${item.id}`}
      data-open={`upnext-${item.id}`}
      transition={springLayout}
      onClick={onOpen}
      whileTap={{ scale: 0.98 }}
      style={{ borderRadius: 16 }}
      className="grid w-full grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-3 py-3 text-left transition-colors hover:bg-text-1/[0.04]"
    >
      <EmojiTile emoji={item.emoji} theme={theme} size={40} layoutId={`upnext-emoji-${item.id}`} />
      <span className="min-w-0">
        <span className="block truncate font-ui text-15 font-semibold">{item.title}</span>
        <span className="mt-0.5 flex items-center gap-1.5 font-ui text-12 text-text-2">
          <span title={`Estilo: ${styleName}`} className="flex h-4 w-6 shrink-0 origin-left scale-[0.7] items-center">
            <Glyph k={item.style ?? 'digits'} theme={theme} />
          </span>
          <Relative target={item.target} />
        </span>
      </span>
      <Remaining target={item.target} />
      <Progress item={item} theme={theme} />
    </motion.button>
  );
});

function Relative({ target }) {
  const rel = useNowSelector(useCallback((now) => relative(target, now), [target]));
  return <span className="truncate">{rel}</span>;
}

// Más de un día: "12 d" + "7 h 03 min". Menos de un día: "9:21 h" + segundos
// corriendo. Menos de una hora: "21:05 min".
function Remaining({ target }) {
  const sig = useNowSelector(
    useCallback(
      (now) => {
        const ms = Math.max(0, target - now);
        const d = Math.floor(ms / DAY);
        const h = Math.floor((ms % DAY) / 3_600_000);
        const m = Math.floor((ms % 3_600_000) / 60_000);
        const s = Math.floor((ms % 60_000) / 1000);
        if (d >= 1) return [d, 'd', `${h} h ${pad(m)} min ${pad(s)} s`].join('|');
        if (h >= 1) return [`${h}:${pad(m)}`, 'h', `${pad(s)} s`].join('|');
        return [`${m}:${pad(s)}`, 'min', 'restantes'].join('|');
      },
      [target]
    )
  );
  const [big, unit, detail] = sig.split('|');
  return (
    <span className="flex flex-col items-end">
      <span className="flex items-baseline gap-1">
        <NumericText value={big} className="font-ui text-28 font-semibold leading-none" />
        <span className="font-ui text-13 font-medium text-text-2">{unit}</span>
      </span>
      <span className="mt-1 font-ui text-12 tabular-nums text-text-3">{detail}</span>
    </span>
  );
}

function Progress({ item, theme }) {
  const p = useNowSelector(useCallback((now) => progress(item.createdAt, item.target, now), [item.createdAt, item.target]));
  return (
    <span className="col-span-2 col-start-2 block h-1 overflow-hidden rounded-full bg-text-1/[0.06]">
      <motion.span
        className="block h-full rounded-full"
        style={{ background: gradient(theme, 90) }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(2, p * 100)}%` }}
        transition={{ duration: 1.2, ease: easeOutExpo }}
      />
    </span>
  );
}
