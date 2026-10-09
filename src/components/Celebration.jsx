import { useMemo } from 'react';
import { motion } from 'framer-motion';

// Ráfaga de confeti: cada partícula sale disparada con un spring y cae con
// "gravedad" (keyframes en y). Se monta, se reproduce una vez y se queda quieta.
export function Celebration({ theme, count = 36 }) {
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
        const dist = 90 + Math.random() * 140;
        return {
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist * 0.7,
          rot: Math.random() * 540 - 270,
          size: 5 + Math.random() * 6,
          round: Math.random() > 0.5,
          color: [theme.from, theme.to, '#ffd60a', '#ffffff'][i % 4],
          delay: Math.random() * 0.12,
        };
      }),
    [count, theme]
  );

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-visible">
      {particles.map((p, i) => (
        <motion.span
          key={i}
          className="absolute"
          style={{
            width: p.size,
            height: p.round ? p.size : p.size * 0.45,
            borderRadius: p.round ? 999 : 2,
            background: p.color,
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0, rotate: 0 }}
          animate={{
            x: [0, p.x, p.x * 1.1],
            y: [0, p.y, p.y + 160],
            opacity: [1, 1, 0],
            scale: [0, 1, 0.8],
            rotate: p.rot,
          }}
          transition={{ duration: 1.6, delay: p.delay, times: [0, 0.35, 1], ease: [0.2, 0.8, 0.4, 1] }}
        />
      ))}
    </div>
  );
}
