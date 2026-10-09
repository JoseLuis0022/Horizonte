// Fuente única de verdad de motion. No definir springs/duraciones ad-hoc en
// un componente: todo pasa por aquí (mismo criterio que CUSOL).

export const spring = { type: 'spring', stiffness: 400, damping: 32, mass: 0.9 }; // default
export const springSnappy = { type: 'spring', stiffness: 500, damping: 35 }; // press / toggles
export const springSoft = { type: 'spring', stiffness: 260, damping: 30 }; // modales, sheets
export const springLayout = { type: 'spring', stiffness: 320, damping: 34, mass: 1 }; // shared element
export const springBouncy = { type: 'spring', stiffness: 380, damping: 18 }; // celebraciones

export const ease = [0.32, 0.72, 0, 1];
// Solo para interpolar VALORES (contadores, anillos), nunca posición de UI.
export const easeOutExpo = [0.16, 1, 0.3, 1];

export const dur = { fast: 0.15, base: 0.2, slow: 0.25, reveal: 0.45 };
export const stagger = { tight: 0.025, base: 0.04, loose: 0.06 };

export const screenEnter = {
  hidden: { opacity: 0, y: 12, filter: 'blur(8px)' },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { ...springSoft, delay: 0.08 + i * stagger.loose },
  }),
};
