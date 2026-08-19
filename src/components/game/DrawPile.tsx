'use client';
// ============================================================================
// DrawPile — Face-down draw pile with stacked visual
// ============================================================================

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface DrawPileProps {
  count: number;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export default function DrawPile({ count, onClick, disabled = false, className }: DrawPileProps) {
  const isClickable = !disabled && onClick;

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <motion.div
        className={cn(
          'relative card-size-lg cursor-pointer select-none',
          isClickable && 'card-hoverable',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onClick={isClickable ? onClick : undefined}
        whileHover={isClickable ? { y: -3 } : undefined}
        whileTap={isClickable ? { scale: 0.97 } : undefined}
      >
        {/* Stacked cards effect */}
        {count > 2 && (
          <div className="absolute inset-0 rounded-lg card-back-pattern border border-blue-900/40 shadow-md transform translate-x-1 translate-y-1" />
        )}
        {count > 1 && (
          <div className="absolute inset-0 rounded-lg card-back-pattern border border-blue-900/40 shadow-md transform translate-x-0.5 translate-y-0.5" />
        )}
        
        {/* Top card */}
        {count > 0 ? (
          <div className="absolute inset-0 rounded-lg card-back-pattern border border-blue-800/50 shadow-lg overflow-hidden">
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-[60%] h-[70%] rounded border border-blue-400/20 flex items-center justify-center bg-blue-900/40">
                <span className="text-blue-400/50 font-bold text-lg">P</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 rounded-lg border-2 border-dashed border-slate-700/50 flex items-center justify-center bg-slate-900/30">
            <span className="text-slate-600 text-xs">Empty</span>
          </div>
        )}
      </motion.div>

      {/* Label & count */}
      <div className="text-center">
        <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Draw</p>
        <p className="text-xs text-muted-foreground">{count} cards</p>
      </div>
    </div>
  );
}
