import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ease, springSoft } from '../../lib/motion';
import { emerge } from '../../lib/origin';

// Modal secundario que emerge desde el campo que lo abrió.
// Va en portal: el composer tiene transform y un `fixed` dentro de él
// quedaría anclado al composer en lugar de a la ventana.
export function PickerModal({ open, origin, onClose, children }) {
  useEffect(() => {
    if (!open) return;
    // Fase de captura: se atiende antes que el Esc del composer y lo frena,
    // así Esc cierra solo el selector.
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      e.stopImmediatePropagation();
      onClose();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center p-2 sm:items-center sm:p-6">
          <motion.div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease }}
            onClick={onClose}
          />
          <motion.div
            {...emerge(origin)}
            transition={springSoft}
            role="dialog"
            aria-modal="true"
            className="relative z-10 w-full max-w-sm overflow-hidden rounded-[28px] bg-surface-1 shadow-3"
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
