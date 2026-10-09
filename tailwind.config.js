/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    fontFamily: {
      ui: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"SF Pro Text"', 'Inter', 'system-ui', 'sans-serif'],
      round: ['"SF Pro Rounded"', 'ui-rounded', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
    },
    fontSize: {
      12: ['12px', { lineHeight: '16px' }],
      13: ['13px', { lineHeight: '18px' }],
      15: ['15px', { lineHeight: '22px' }],
      17: ['17px', { lineHeight: '24px' }],
      22: ['22px', { lineHeight: '28px', fontWeight: '600' }],
      28: ['28px', { lineHeight: '34px', fontWeight: '600' }],
      40: ['40px', { lineHeight: '44px', fontWeight: '700' }],
    },
    // Radios anidados: modal > card > control > cell
    borderRadius: {
      none: '0px',
      cell: '8px',
      control: '12px',
      card: '24px',
      modal: '32px',
      full: '9999px',
    },
    boxShadow: {
      1: 'var(--shadow-1)',
      2: 'var(--shadow-2)',
      3: 'var(--shadow-3)',
      none: 'none',
    },
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: { 1: 'var(--surface-1)', 2: 'var(--surface-2)' },
        hairline: 'var(--hairline)',
        text: { 1: 'var(--text-1)', 2: 'var(--text-2)', 3: 'var(--text-3)' },
        accent: { DEFAULT: 'var(--accent)', soft: 'var(--accent-soft)' },
        danger: { DEFAULT: 'var(--danger)', soft: 'var(--danger-soft)' },
      },
    },
  },
  plugins: [],
};
