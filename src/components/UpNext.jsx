import { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { EmojiTile } from './EmojiTile';
import { getTheme } from '../lib/themes';
import { DAY, relative } from '../lib/time';
import { useNowSelector } from '../lib/useNow';
import { springLayout, springSoft } from '../lib/motion';

// Columna lateral junto al Hero en pantallas anchas: los siguientes
// countdowns de un vistazo. Solo re-renderiza cuando cambia el día o la
// etiqueta relativa, no cada segundo.
export function UpNext({ items, onOpen }) {
  return (
    <motion.aside
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      transition={{ ...springSoft, delay: 0.15 }}
      aria-label="Después"
      className="flex min-w-0 flex-col rounded-modal border border-hairline bg-surface-1 p-4 shadow-2"
    >
      <span className="px-2 pb-2 pt-1 font-ui text-12 font-semibold uppercase tracking-wide text-text-2">Después</span>
      <div className="flex flex-1 flex-col justify-around gap-1">
        {items.map((item) => (
          <UpNextRow key={item.id} item={item} onOpen={() => onOpen(item.id)} />
        ))}
      </div>
    </motion.aside>
  );
}

const UpNextRow = memo(function UpNextRow({ item, onOpen }) {
  const theme = getTheme(item.theme);
  const label = useNowSelector(
    useCallback(
      (now) => `${Math.floor(Math.max(0, item.target - now) / DAY)}|${relative(item.target, now)}`,
      [item.target]
    )
  );
  const [days, rel] = label.split('|');

  return (
    <motion.button
      layoutId={`upnext-${item.id}`}
      transition={springLayout}
      onClick={onOpen}
      whileTap={{ scale: 0.98 }}
      style={{ borderRadius: 16 }}
      className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-text-1/[0.04]"
    >
      <EmojiTile emoji={item.emoji} theme={theme} size={40} layoutId={`upnext-emoji-${item.id}`} />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-ui text-15 font-semibold">{item.title}</span>
        <span className="block truncate font-ui text-13 text-text-2">{rel}</span>
      </span>
      <span className="flex items-baseline gap-1">
        <span className="font-ui text-28 tabular-nums">{days}</span>
        <span className="font-ui text-13 text-text-2">d</span>
      </span>
    </motion.button>
  );
});
