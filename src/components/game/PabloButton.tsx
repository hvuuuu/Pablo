'use client';
// ============================================================================
// PabloButton — Glowing "PABLO!" call button
// ============================================================================

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PabloButtonProps {
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;      // Show pulsing glow when it's the player's turn and they can call
  className?: string;
}

export default function PabloButton({ onClick, disabled = false, active = false, className }: PabloButtonProps) {
  return (
    <motion.button
      className={cn(
        'relative px-6 py-3 md:px-8 md:py-4 rounded-2xl font-black text-lg md:text-xl uppercase tracking-widest',
        'bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600',
        'text-amber-950 border-2 border-amber-400/50',
        'transition-all duration-300',
        'select-none',
        active && !disabled && 'pablo-button-active cursor-pointer',
        disabled && 'opacity-30 cursor-not-allowed grayscale',
        !disabled && !active && 'hover:brightness-110 cursor-pointer opacity-60',
        className
      )}
      onClick={disabled ? undefined : onClick}
      whileHover={!disabled ? { scale: 1.05 } : undefined}
      whileTap={!disabled ? { scale: 0.95 } : undefined}
      disabled={disabled}
    >
      <span className="relative z-10 flex items-center gap-2">
        PABLO
      </span>

      {/* Glow background */}
      {active && !disabled && (
        <motion.div
          className="absolute inset-0 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-400/30 to-amber-500/20"
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}
    </motion.button>
  );
}
