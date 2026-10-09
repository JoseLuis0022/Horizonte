import { clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// La escala tipográfica es numérica (text-13, text-15…). Sin esto,
// tailwind-merge la confunde con un color y descarta p. ej. `text-white`.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['12', '13', '15', '17', '22', '28', '40'] }],
    },
  },
});

export const cn = (...args) => twMerge(clsx(args));
