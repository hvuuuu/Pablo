'use client';
// ============================================================================
// ScoreBoard — End-of-game leaderboard
// ============================================================================

import { motion } from 'framer-motion';
import { Trophy, Crown } from 'lucide-react';
import { Player } from '@/lib/game/types';
import { SUIT_SYMBOLS } from '@/lib/game/constants';
import { getCardPoints } from '@/lib/game/scoring';
import { cn } from '@/lib/utils';

interface ScoreBoardProps {
  players: Player[];
  winnerId: string | null;
  pabloCallerId: string | null;
  className?: string;
}

export default function ScoreBoard({ players, winnerId, pabloCallerId, className }: ScoreBoardProps) {
  const sorted = [...players].sort((a, b) => (a.score ?? 0) - (b.score ?? 0));
  const pabloCaller = players.find(p => p.id === pabloCallerId);
  const pabloCallerWon = pabloCallerId === winnerId;

  return (
    <div className={cn('w-full max-w-lg mx-auto', className)}>
      {/* Pablo caller result */}
      {pabloCaller && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'mb-4 px-4 py-3 rounded-xl border text-center text-sm font-medium',
            pabloCallerWon
              ? 'bg-emerald-900/40 border-emerald-500/40 text-emerald-300'
              : 'bg-red-900/40 border-red-500/40 text-red-300'
          )}
        >
          {pabloCallerWon ? (
            <span>🎉 <strong>{pabloCaller.name}</strong> called Pablo and WON!</span>
          ) : (
            <span>😬 <strong>{pabloCaller.name}</strong> called Pablo but did not have the lowest score!</span>
          )}
        </motion.div>
      )}

      {/* Leaderboard */}
      <div className="space-y-2.5">
        {sorted.map((player, index) => {
          const isWinner = player.id === winnerId;
          const isPabloCaller = player.id === pabloCallerId;

          return (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.15 }}
              className={cn(
                'flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border transition-all',
                isWinner
                  ? 'bg-amber-950/30 border-amber-500/50 shadow-lg glow-gold'
                  : 'bg-slate-900/70 border-slate-800'
              )}
            >
              {/* Left: Rank, Avatar & Name */}
              <div className="flex items-center gap-3 min-w-0">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0',
                  index === 0 ? 'bg-amber-500 text-amber-950 shadow-sm' :
                  index === 1 ? 'bg-slate-300 text-slate-900' :
                  index === 2 ? 'bg-amber-700 text-amber-100' :
                  'bg-slate-800 text-slate-400'
                )}>
                  {index + 1}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">{player.emoji}</span>
                    <span className={cn(
                      'font-bold text-sm truncate',
                      isWinner ? 'text-amber-300' : 'text-slate-200'
                    )}>
                      {player.name}
                    </span>
                    {isWinner && <Trophy className="w-4 h-4 text-amber-400 shrink-0" />}
                    {isPabloCaller && <Crown className="w-3.5 h-3.5 text-purple-400 shrink-0" />}
                  </div>

                  {/* Cards reveal preview */}
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    {player.cards.map((card, ci) => {
                      const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
                      const points = getCardPoints(card);
                      return (
                        <div
                          key={ci}
                          className={cn(
                            'px-1.5 py-0.5 rounded border text-[11px] font-mono font-bold flex items-center gap-1 shadow-sm',
                            'bg-slate-100 border-slate-300',
                            isRed ? 'text-red-600' : 'text-slate-950'
                          )}
                        >
                          <span>{card.rank}{SUIT_SYMBOLS[card.suit]}</span>
                          <span className="text-[9px] text-slate-500 font-sans font-normal">({points})</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right: Score */}
              <div className={cn(
                'text-right sm:text-right shrink-0 self-end sm:self-center',
                isWinner ? 'text-amber-300' : 'text-slate-300'
              )}>
                <div className="text-2xl font-black font-mono leading-none">{player.score}</div>
                <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">points</div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
