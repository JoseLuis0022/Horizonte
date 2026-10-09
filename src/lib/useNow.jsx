import { useCallback, useSyncExternalStore } from 'react';

// Un solo reloj para toda la app, alineado al cambio de segundo, como store
// externo: cada componente se suscribe solo a lo que necesita.
//  · useNow()            → re-renderiza cada segundo (dígitos que corren).
//  · useNowSelector(fn)  → re-renderiza solo cuando cambia fn(now), p. ej.
//    cuando un countdown cruza el cero. Así el árbol completo (y los nodos con
//    `layout` de Framer, que miden el DOM en cada render) no se toca cada segundo.
let now = Date.now();
const listeners = new Set();
let timer = null;

function tick() {
  now = Date.now();
  listeners.forEach((l) => l());
  timer = setTimeout(tick, 1000 - (now % 1000) + 4);
}

function subscribe(listener) {
  listeners.add(listener);
  if (!timer) timer = setTimeout(tick, 1000 - (Date.now() % 1000) + 4);
  return () => {
    listeners.delete(listener);
    if (!listeners.size) {
      clearTimeout(timer);
      timer = null;
    }
  };
}

export const getNow = () => now;

export function useNow() {
  return useSyncExternalStore(subscribe, getNow);
}

// `selector` debe devolver un primitivo (string/number/boolean).
export function useNowSelector(selector) {
  const snap = useCallback(() => selector(now), [selector]);
  return useSyncExternalStore(subscribe, snap);
}

// Compatibilidad: ya no hace falta un provider.
export function NowProvider({ children }) {
  return children;
}
