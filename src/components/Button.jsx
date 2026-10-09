import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/cn';
import { springSnappy } from '../lib/motion';

const VARIANTS = {
  primary: 'bg-accent text-white shadow-1 hover:shadow-2 disabled:bg-surface-2 disabled:text-text-3 disabled:shadow-none',
  secondary: 'bg-surface-1 text-text-1 border border-hairline hover:bg-accent-soft',
  ghost: 'bg-transparent text-text-1 hover:bg-accent-soft',
  danger: 'bg-danger-soft text-danger hover:bg-danger hover:text-white',
};

const SIZES = {
  sm: 'h-9 px-3.5 text-13',
  md: 'h-11 px-5 text-15',
};

// hover y:-1 + sombra, tap scale .97 — catálogo de microinteracciones CUSOL.
export const Button = forwardRef(function Button({ variant = 'primary', size = 'md', className, disabled, children, ...props }, ref) {
  return (
    <motion.button
      ref={ref}
      disabled={disabled}
      whileHover={disabled ? undefined : { y: -1 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={springSnappy}
      className={cn(
        'inline-flex min-h-[44px] items-center justify-center gap-2 whitespace-nowrap rounded-full font-ui font-semibold transition-colors duration-150 disabled:cursor-not-allowed',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
});

export const IconButton = forwardRef(function IconButton({ className, children, ...props }, ref) {
  return (
    <motion.button
      ref={ref}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.9 }}
      transition={springSnappy}
      className={cn(
        'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-2/80 text-text-2 backdrop-blur-xl transition-colors duration-150 hover:text-text-1',
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
});
