// Desplazamiento entre el centro de la ventana y el elemento que abrió un
// modal. Con él, el modal "emerge" desde ese elemento y regresa a él al
// cerrarse (continuidad espacial) sin depender de layoutId, que puede dejar
// paneles huérfanos si la transición se interrumpe.
export function originOffset(el) {
  if (!el?.getBoundingClientRect) return { x: 0, y: 60 };
  const r = el.getBoundingClientRect();
  return {
    x: r.left + r.width / 2 - window.innerWidth / 2,
    y: r.top + r.height / 2 - window.innerHeight / 2,
  };
}

export function emerge(o = { x: 0, y: 60 }) {
  return {
    initial: { opacity: 0, scale: 0.3, x: o.x, y: o.y },
    animate: { opacity: 1, scale: 1, x: 0, y: 0 },
    exit: { opacity: 0, scale: 0.3, x: o.x, y: o.y },
  };
}
