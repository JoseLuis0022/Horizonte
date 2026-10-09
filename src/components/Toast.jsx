import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { springSoft } from '../lib/motion';

export function Toast({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDismiss, 5000);
    return () => clearTimeout(t);
  }, [toast, onDismiss]);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-center px-4 pb-[max(16px,env(safe-area-inset-bottom))]">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.key}
            initial={{ y: 40, opacity: 0, scale: 0.9, filter: 'blur(6px)' }}
            animate={{ y: 0, opacity: 1, scale: 1, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }}
            exit={{ y: 20, opacity: 0, scale: 0.95, filter: 'blur(6px)' }}
            transition={springSoft}
            className="pointer-events-auto flex items-center gap-4 rounded-full bg-[#1d1d1f]/90 py-2 pl-5 pr-2 text-white shadow-3 backdrop-blur-xl dark:bg-[#3a3a3c]/90"
          >
            <span className="font-ui text-15">{toast.message}</span>
            {toast.action && (
              <button
                onClick={() => {
                  toast.action.run();
                  onDismiss();
                }}
                className="h-9 rounded-full bg-white/15 px-4 font-ui text-13 font-semibold transition-colors hover:bg-white/25"
              >
                {toast.action.label}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
