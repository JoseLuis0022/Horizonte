import { memo } from 'react';
import { motion } from 'framer-motion';
import { gradient } from '../lib/themes';
import { springLayout } from '../lib/motion';

// Icono tipo app de iOS: degradado del tema + brillo superior.
// memo: tiene layoutId, y un nodo con layout que re-renderiza obliga a Framer
// a medir todos los nodos de layout de la página.
export const EmojiTile = memo(function EmojiTile({ emoji, theme, size = 44, layoutId }) {
  const radius = Math.round(size * 0.28);
  return (
    <motion.div
      layoutId={layoutId}
      transition={springLayout}
      className="relative flex shrink-0 items-center justify-center overflow-hidden shadow-1"
      style={{ width: size, height: size, borderRadius: radius, background: gradient(theme) }}
    >
      <span
        aria-hidden
        className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.35), rgba(255,255,255,0) 55%)' }}
      />
      <span className="relative select-none" style={{ fontSize: size * 0.5, lineHeight: 1 }}>
        {emoji}
      </span>
    </motion.div>
  );
});
