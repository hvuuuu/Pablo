'use client';
// ============================================================================
// GameOverOverlay — Full-screen winner announcement with confetti & rematch system
// ============================================================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RotateCcw, Play, Check, Crown, Users, SquareMousePointer, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Player } from '@/lib/game/types';
import ScoreBoard from './ScoreBoard';
import { cn } from '@/lib/utils';

interface GameOverOverlayProps {
  players: Player[];
  winnerId: string | null;
  pabloCallerId: string | null;
  open: boolean;
  currentPlayerId?: string;
  isHost?: boolean;
  rematchVotes?: string[];
  onPlayAgain?: () => void;
  onStartNewRound?: () => void;
  onGoHome?: () => void;
}

// Confetti generator
function createConfettiPieces(count: number) {
  const colors = ['#10B981', '#F59E0B', '#3B82F6', '#EF4444', '#8B5CF6', '#EC4899', '#FBBF24'];
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    color: colors[i % colors.length],
    left: Math.random() * 100,
    delay: Math.random() * 3,
    duration: 2 + Math.random() * 3,
    size: 6 + Math.random() * 8,
    rotation: Math.random() * 360,
  }));
}

export default function GameOverOverlay({
  players,
  winnerId,
  pabloCallerId,
  open,
  currentPlayerId,
  isHost = false,
  rematchVotes = [],
  onPlayAgain,
  onStartNewRound,
  onGoHome,
}: GameOverOverlayProps) {
  const [confetti] = useState(() => createConfettiPieces(40));
  const [minimized, setMinimized] = useState(false);
  const winner = players.find(p => p.id === winnerId);
  const host = players.find(p => p.isHost);

  const isMeReady = Boolean(currentPlayerId && rematchVotes.includes(currentPlayerId));
  const isHostReady = Boolean(host && rematchVotes.includes(host.id));
  const readyCount = rematchVotes.length;
  const totalPlayers = players.length;

  if (!open) return null;

  return (
    <>
      {/* Floating Toggle Button when minimized to inspect table */}
      {minimized && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed bottom-6 right-6 z-[70]"
        >
          <Button
            variant="amber"
            size="xl"
            onClick={() => setMinimized(false)}
            className="flex items-center gap-2 rounded-2xl shadow-2xl"
          >
            <Trophy className="w-5 h-5" />
            <span>Show Results</span>
          </Button>
        </motion.div>
      )}

      <AnimatePresence>
        {!minimized && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto p-4"
          >
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
              onClick={() => setMinimized(true)}
            />

            {/* Confetti */}
            {confetti.map((piece) => (
              <div
                key={piece.id}
                className="confetti-piece rounded-sm"
                style={{
                  left: `${piece.left}%`,
                  top: '-20px',
                  width: `${piece.size}px`,
                  height: `${piece.size}px`,
                  backgroundColor: piece.color,
                  animationDelay: `${piece.delay}s`,
                  animationDuration: `${piece.duration}s`,
                  transform: `rotate(${piece.rotation}deg)`,
                }}
              />
            ))}

            {/* Modal Card */}
            <motion.div
              initial={{ scale: 0.85, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.85, y: 30 }}
              transition={{ type: 'spring', damping: 20 }}
              className="relative bg-slate-950 border border-amber-500/40 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl my-auto z-10"
            >
              {/* Header */}
              <div className="text-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', bounce: 0.5 }}
                  className="w-16 h-16 mx-auto rounded-3xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center mb-3 glow-gold"
                >
                  <Trophy className="w-8 h-8 text-amber-400" />
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300 uppercase tracking-wider"
                >
                  Game Over!
                </motion.h2>

                {winner && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-emerald-400 font-bold text-base md:text-lg mt-1"
                  >
                    {winner.emoji} {winner.name} wins with {winner.score} pts!
                  </motion.p>
                )}
              </div>

              {/* Rematch Host Prompt / Live Status Banner */}
              {readyCount > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-emerald-300 font-bold flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      Rematch Votes:
                    </span>
                    <Badge variant="outline" className="font-mono font-bold text-emerald-400 bg-emerald-900/60 border-emerald-500/30 px-2 py-0.5">
                      {readyCount} / {totalPlayers} Ready
                    </Badge>
                  </div>

                  {!isMeReady && isHostReady && !isHost && (
                    <p className="text-xs text-amber-300 font-medium flex items-center gap-1">
                      <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <strong>{host?.name} (Host)</strong> wants to start a new game! Join them below.
                    </p>
                  )}
                </motion.div>
              )}

              {/* Scoreboard */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <ScoreBoard
                  players={players}
                  winnerId={winnerId}
                  pabloCallerId={pabloCallerId}
                />
              </motion.div>

              {/* Action buttons */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex flex-col gap-2.5 mt-6"
              >
                {/* Rematch action */}
                <div className="flex flex-col sm:flex-row gap-2">
                  {onPlayAgain && (
                    <Button
                      onClick={onPlayAgain}
                      disabled={isMeReady}
                      variant={isMeReady ? "outline" : "emerald"}
                      size="xl"
                      className={cn(
                        'flex-1 font-bold text-sm shadow-lg',
                        isMeReady && 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300 cursor-default'
                      )}
                    >
                      {isMeReady ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-400" />
                          Ready! Waiting for players ({readyCount}/{totalPlayers})
                        </>
                      ) : (
                        <>
                          <RotateCcw className="w-4 h-4" />
                          Play Again (Ready Up)
                        </>
                      )}
                    </Button>
                  )}

                  {/* Host can force start round once 2+ are ready */}
                  {isHost && onStartNewRound && readyCount >= 2 && readyCount < totalPlayers && (
                    <Button
                      onClick={onStartNewRound}
                      variant="amber"
                      size="xl"
                      className="text-sm font-black shadow-lg"
                    >
                      <Play className="w-4 h-4" />
                      Start Round Now ({readyCount} Ready)
                    </Button>
                  )}
                </div>

                {/* Secondary actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMinimized(true)}
                    className="flex-1 h-9 bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl border-slate-700/50"
                  >
                    <SquareMousePointer className="w-3.5 h-3.5" />
                    Inspect Table
                  </Button>
                  {onGoHome && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onGoHome}
                      className="flex-1 h-9 bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white font-semibold text-xs rounded-xl border-slate-800"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Leave Room
                    </Button>
                  )}
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
