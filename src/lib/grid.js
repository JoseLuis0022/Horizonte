import { useEffect, useLayoutEffect, useRef, useState } from 'react';

// Tamaño de una tarjeta en celdas del grid (como los widgets del iPad).
export const MAX_W = 4;
export const MAX_H = 4;
const LEGACY = { s: [1, 1], m: [2, 1], l: [2, 2] };

export function dims(item) {
  if (item.w && item.h) return { w: item.w, h: item.h };
  const [w, h] = LEGACY[item.size ?? 's'] ?? LEGACY.s;
  return { w, h };
}

// Columnas del grid según el ancho; debe coincidir con las clases de App.jsx.
const BREAKPOINTS = [
  [2300, 6],
  [1900, 5],
  [1280, 4],
  [1024, 3],
  [640, 2],
];
const colsFor = (width) => BREAKPOINTS.find(([min]) => width >= min)?.[1] ?? 1;

export function useGridCols() {
  const [cols, setCols] = useState(() => (typeof window === 'undefined' ? 4 : colsFor(window.innerWidth)));
  useEffect(() => {
    const onResize = () => setCols(colsFor(window.innerWidth));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return cols;
}

// Mide un elemento con ResizeObserver; solo re-renderiza cuando cambia de
// tamaño (al redimensionar), nunca por el reloj.
export function useBox() {
  const ref = useRef(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      setBox((b) => (Math.abs(b.w - width) < 1 && Math.abs(b.h - height) < 1 ? b : { w: width, h: height }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, box];
}

// Mayor celda cuadrada que permite meter n elementos en un área W×H.
// gap es proporción de la celda. Devuelve { cols, rows, cell }.
export function fitGrid(n, W, H, gap = 0.3, maxCell = 40) {
  let best = { cols: n, rows: 1, cell: 0 };
  if (!W || !H) return best;
  for (let cols = 1; cols <= n; cols++) {
    const rows = Math.ceil(n / cols);
    const cell = Math.min(W / (cols + (cols - 1) * gap), H / (rows + (rows - 1) * gap), maxCell);
    if (cell > best.cell + 0.01) best = { cols, rows, cell };
  }
  return best;
}

// Forma del espacio disponible: decide la composición del contenido.
export function shapeOf({ w, h }) {
  if (!w || !h) return 'sm';
  const ratio = w / h;
  if (w >= 300 && h >= 270) return 'lg';
  if (ratio >= 2) return 'wide';
  if (ratio <= 0.8) return 'tall';
  return 'sm';
}
