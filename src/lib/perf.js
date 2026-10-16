// Dispositivos táctiles (iPhone, iPad, Android): se evitan los efectos que
// en móvil cuestan más de lo que aportan, como animar `filter: blur()` en los
// dígitos cada segundo (obliga a pintar fuera de pantalla en cada cuadro).
export const LITE = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
