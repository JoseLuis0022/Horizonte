// Paleta de sistema de Apple (iOS) en pares para degradados.
export const THEMES = {
  blue: { name: 'Azul', from: '#0a84ff', to: '#5ac8fa' },
  indigo: { name: 'Índigo', from: '#5e5ce6', to: '#bf5af2' },
  pink: { name: 'Rosa', from: '#ff375f', to: '#ff9f0a' },
  orange: { name: 'Naranja', from: '#ff9f0a', to: '#ffd60a' },
  green: { name: 'Verde', from: '#30d158', to: '#64d2ff' },
  graphite: { name: 'Grafito', from: '#636366', to: '#aeaeb2' },
};

export const THEME_KEYS = Object.keys(THEMES);

export const getTheme = (key) => THEMES[key] ?? THEMES.blue;

export const gradient = (theme, angle = 135) => `linear-gradient(${angle}deg, ${theme.from}, ${theme.to})`;

export const EMOJIS = ['🎉', '🎄', '🎂', '✈️', '🚀', '💍', '🎓', '🏖️', '⚽️', '🎬', '💼', '❤️', '🏃', '🎵', '📦', '🌙'];
