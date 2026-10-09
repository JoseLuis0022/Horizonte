import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ease } from '../lib/motion';

// Fondo desenfocado + bloqueo de scroll + Esc para cerrar. Compartido por
// el detalle y el composer.
export function Overlay({ onClose, children }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-2 sm:items-center sm:p-6">
      <motion.div
        className="absolute inset-0 bg-black/25 backdrop-blur-md dark:bg-black/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease }}
        onClick={onClose}
      />
      {children}
    </div>
  );
}
