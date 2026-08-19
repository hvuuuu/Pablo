'use client';
// ============================================================================
// TurnIndicator — Shows whose turn it is with timer bar
// ============================================================================

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TurnIndicatorProps {
  playerName: string;
  isMyTurn: boolean;
  timeLimit: number;       // seconds
  turnStartedAt: number;   // timestamp
  isPabloCalled?: boolean;
  pabloCallerName?: string;
  className?: string;
}

export default function TurnIndicator({
  playerName,
  isMyTurn,
  timeLimit,
  turnStartedAt,
  isPabloCalled = false,
  pabloCallerName,
  className,
}: TurnIndicatorProps) {
  const [timeLeft, setTimeLeft] = useState(timeLimit);

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - turnStartedAt) / 1000);
      setTimeLeft(Math.max(0, timeLimit - elapsed));
    }, 1000);

    return () => clearInterval(interval);
  }, [turnStartedAt, timeLimit]);

  const percentage = (timeLeft / timeLimit) * 100;
  const isLow = timeLeft <= 10;

  return (
    <div className={cn('w-full max-w-md mx-auto', className)}>
      {/* Pablo called banner */}
      {isPabloCalled && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="bg-amber-900/30 border border-amber-500/30 rounded-lg px-3 py-2 mb-2 flex items-center gap-2"
        >
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-xs text-amber-300 font-medium">
            <strong>{pabloCallerName}</strong> called PABLO! Final round!
          </span>
        </motion.div>
      )}

      {/* Turn info */}
      <div className="flex items-center justify-between mb-1">
        <motion.span
          key={playerName}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className={cn(
            'text-sm font-semibold',
            isMyTurn ? 'text-emerald-300' : 'text-slate-400'
          )}
        >
          {isMyTurn ? '🎯 Your Turn!' : `${playerName}'s turn`}
        </motion.span>

        <div className={cn(
          'flex items-center gap-1 text-xs font-mono',
          isLow ? 'text-red-400' : 'text-slate-400'
        )}>
          <Clock className="w-3 h-3" />
          <span>{timeLeft}s</span>
        </div>
      </div>

      {/* Timer bar */}
      <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
        <motion.div
          className={cn(
            'h-full rounded-full transition-colors duration-500',
            isLow ? 'bg-red-500' : isMyTurn ? 'bg-emerald-500' : 'bg-slate-600'
          )}
          initial={{ width: '100%' }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );
}
