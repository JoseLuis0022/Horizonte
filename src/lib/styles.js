// Formas de representar un countdown. `key` se guarda en cada countdown.
export const STYLES = [
  { key: 'digits', name: 'Números' },
  { key: 'dots', name: 'Puntitos' },
  { key: 'rings', name: 'Anillos' },
  { key: 'bar', name: 'Barra' },
  { key: 'weeks', name: 'Semanas' },
  { key: 'columns', name: 'Columnas' },
  { key: 'arc', name: 'Arco' },
];

// Estilos que ya muestran el progreso por sí mismos (no necesitan anillo/barra extra).
export const SELF_PROGRESS = new Set(['rings', 'bar', 'dots', 'arc']);
