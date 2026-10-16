import { dims } from './grid';
import { useCallback, useEffect, useState } from 'react';
import { DAY } from './time';

const KEY = 'countdowns.v3';
const FEATURED_KEY = 'countdowns.featured';

function nextOccurrence(month, day) {
  const now = new Date();
  let d = new Date(now.getFullYear(), month, day);
  if (d.getTime() < now.getTime()) d = new Date(now.getFullYear() + 1, month, day);
  return d.getTime();
}

function seed() {
  const now = Date.now();
  return [
    { id: 's1', w: 2, h: 2, style: 'dots', title: 'Navidad', emoji: '🎄', theme: 'green', target: nextOccurrence(11, 25), createdAt: now - 40 * DAY },
    { id: 's2', style: 'arc', title: 'Vacaciones en la playa', emoji: '🏖️', theme: 'orange', target: now + 23 * DAY + 5 * 3_600_000, createdAt: now - 12 * DAY },
    { id: 's3', w: 2, h: 1, style: 'rings', title: 'Lanzamiento de la app', emoji: '🚀', theme: 'indigo', target: now + 3 * DAY + 7 * 3_600_000, createdAt: now - 20 * DAY },
    { id: 's4', style: 'bar', title: 'Año Nuevo', emoji: '🎉', theme: 'pink', target: nextOccurrence(0, 1), createdAt: now - 30 * DAY },
    { id: 's5', style: 'digits', title: 'Concierto', emoji: '🎵', theme: 'blue', target: now + 9 * 3_600_000 + 42 * 60_000, createdAt: now - 6 * DAY },
    { id: 's7', style: 'weeks', title: 'Cumpleaños de mamá', emoji: '🎂', theme: 'pink', target: now + 48 * DAY, createdAt: now - 60 * DAY },
    { id: 's8', style: 'columns', title: 'Maratón', emoji: '🏃', theme: 'blue', target: now + 12 * DAY + 3 * 3_600_000, createdAt: now - 9 * DAY },
    { id: 's6', style: 'columns', title: 'Entrega del proyecto', emoji: '💼', theme: 'graphite', target: now - 2 * DAY, createdAt: now - 30 * DAY },
  ].sort((a, b) => a.target - b.target);
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const xs = JSON.parse(raw).map((x) => (['flip', 'liquid'].includes(x.style) ? { ...x, style: 'digits' } : x));
      // Datos de antes de que existieran los tamaños: aplica los del ejemplo.
      const demo = { s1: 'l', s3: 'm' };
      const sized = xs.some((x) => x.size || x.w) ? xs : xs.map((x) => (demo[x.id] ? { ...x, size: demo[x.id] } : x));
      // Tamaños fijos (chico/mediano/grande) → celdas libres w×h.
      return sized.map(({ size, ...x }) => ({ ...x, ...dims({ size, ...x }) }));
    }
  } catch {
    // almacenamiento bloqueado o corrupto: se arranca con datos de ejemplo
  }
  return seed();
}

function loadFeatured() {
  try {
    return localStorage.getItem(FEATURED_KEY);
  } catch {
    return null;
  }
}

export function useCountdowns() {
  const [items, setItems] = useState(load);
  // null = automático (el más próximo)
  const [featuredId, setFeaturedId] = useState(loadFeatured);

  useEffect(() => {
    try {
      if (featuredId) localStorage.setItem(FEATURED_KEY, featuredId);
      else localStorage.removeItem(FEATURED_KEY);
    } catch {
      // sin persistencia
    }
  }, [featuredId]);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      // sin persistencia (modo privado); la app sigue funcionando en memoria
    }
  }, [items]);

  const add = useCallback((data) => {
    const item = { id: crypto.randomUUID?.() ?? String(Date.now()), createdAt: Date.now(), ...data };
    setItems((xs) => [...xs, item]);
    return item;
  }, []);

  const update = useCallback((id, data) => {
    setItems((xs) => xs.map((x) => (x.id === id ? { ...x, ...data } : x)));
  }, []);

  const remove = useCallback((id) => {
    setItems((xs) => xs.filter((x) => x.id !== id));
    setFeaturedId((f) => (f === id ? null : f));
  }, []);

  // Mueve `id` a la posición que ocupa `overId` (orden manual del grid).
  const move = useCallback((id, overId) => {
    setItems((xs) => {
      const from = xs.findIndex((x) => x.id === id);
      const to = xs.findIndex((x) => x.id === overId);
      if (from < 0 || to < 0 || from === to) return xs;
      const next = [...xs];
      next.splice(to, 0, next.splice(from, 1)[0]);
      return next;
    });
  }, []);

  const sortByDate = useCallback(() => {
    setItems((xs) => [...xs].sort((a, b) => a.target - b.target));
  }, []);

  const restore = useCallback((item) => {
    setItems((xs) => (xs.some((x) => x.id === item.id) ? xs : [...xs, item]));
  }, []);

  return { items, add, update, remove, restore, move, sortByDate, featuredId, setFeaturedId };
}
