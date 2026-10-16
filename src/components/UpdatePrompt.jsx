import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw } from 'lucide-react';
import { springSoft } from '../lib/motion';

const CHECK_EVERY = 30 * 60_000;

// Actualizaciones de la PWA:
// 1. Con conexión, la app pregunta por una versión nueva al abrirse, cada
//    30 min, al recuperar internet y al volver a primer plano.
// 2. Si hay una, el service worker la descarga completa y la deja en caché.
// 3. Se aplica con el botón "Actualizar", o sola cuando la app pasa a segundo
//    plano (el usuario no ve el recargo) o al abrirse la próxima vez.
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, reg) {
      if (!reg) return;
      const check = () => {
        if (navigator.onLine && !reg.installing) reg.update().catch(() => {});
      };
      setInterval(check, CHECK_EVERY);
      window.addEventListener('online', check);
      document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && check());
    },
  });

  // Si la página aún no la controla un worker, no llega el evento que
  // recarga: se recarga a mano cuando el worker nuevo ya se activó.
  const apply = () => {
    updateServiceWorker(true);
    if (!navigator.serviceWorker?.controller) setTimeout(() => window.location.reload(), 800);
  };

  useEffect(() => {
    if (!needRefresh) return;
    const onHide = () => document.visibilityState === 'hidden' && apply();
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, [needRefresh]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="pointer-events-none fixed inset-x-0 top-[max(72px,calc(env(safe-area-inset-top)+64px))] z-[60] flex justify-center px-4">
      <AnimatePresence>
        {needRefresh && (
          <motion.div
            initial={{ y: -24, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -16, opacity: 0, scale: 0.95 }}
            transition={springSoft}
            className="pointer-events-auto flex items-center gap-3 rounded-full border border-hairline bg-surface-1 py-1.5 pl-4 pr-1.5 shadow-3"
          >
            <span className="font-ui text-15 font-medium">Hay una versión nueva lista</span>
            <button
              onClick={apply}
              className="flex h-9 items-center gap-1.5 rounded-full bg-accent px-4 font-ui text-13 font-semibold text-white transition-transform active:scale-95"
            >
              <RefreshCw size={14} strokeWidth={2.5} /> Actualizar
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
