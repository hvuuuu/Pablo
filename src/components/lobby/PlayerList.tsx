'use client';
// ============================================================================
// PlayerList — Lobby player list with ready states
// ============================================================================

import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Check, Clock, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Player } from '@/lib/game/types';
import { cn } from '@/lib/utils';

interface PlayerListProps {
  players: Player[];
  currentPlayerId: string;
  className?: string;
}

export default function PlayerList({ players, currentPlayerId, className }: PlayerListProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-4 h-4 text-slate-400" />
        <span className="text-sm font-semibold text-slate-300">
          Players ({players.length}/6)
        </span>
      </div>

      <AnimatePresence>
        {players.map((player, index) => {
          const isMe = player.id === currentPlayerId;

          return (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl border transition-all',
                isMe
                  ? 'bg-emerald-900/20 border-emerald-700/40'
                  : 'bg-slate-800/30 border-slate-700/30',
                player.isReady && 'border-emerald-500/40'
              )}
            >
              {/* Avatar */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-xl border-2 shrink-0"
                style={{
                  backgroundColor: `${player.color}15`,
                  borderColor: `${player.color}50`,
                }}
              >
                {player.emoji}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={cn(
                    'font-semibold text-sm truncate',
                    isMe ? 'text-emerald-300' : 'text-slate-200'
                  )}>
                    {player.name}
                  </span>
                  {isMe && (
                    <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/40 bg-emerald-950/60 font-semibold px-1.5 py-0 h-4">
                      YOU
                    </Badge>
                  )}
                  {player.isHost && (
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                  )}
                </div>
                <span className={cn(
                  'text-xs',
                  player.isReady ? 'text-emerald-400' : 'text-slate-500'
                )}>
                  {player.isReady ? 'Ready' : 'Not ready'}
                </span>
              </div>

              {/* Ready indicator */}
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                player.isReady ? 'bg-emerald-900/50 text-emerald-400' : 'bg-slate-800 text-slate-600'
              )}>
                {player.isReady ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Clock className="w-4 h-4" />
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
