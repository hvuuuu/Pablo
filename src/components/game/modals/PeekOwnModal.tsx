'use client';
// ============================================================================
// PeekOwnModal — Card 7 ability: Confirmation modal after selecting card on board
// ============================================================================

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/lib/game/types';
import PlayingCard from '../PlayingCard';

interface PeekOwnModalProps {
  cards: Card[];
  selectedCardIndex: number;
  onConfirm: (cardIndex: number) => void;
  onCancel: () => void;
  open: boolean;
}

function PeekOwnModalContent({ cards, selectedCardIndex, onConfirm, onCancel }: Omit<PeekOwnModalProps, 'open'>) {
  const [countdown, setCountdown] = useState(4);

  const revealedCard =
    selectedCardIndex >= 0 && selectedCardIndex < cards.length
      ? cards[selectedCardIndex]
      : null;

  // Timed auto-close
  useEffect(() => {
    if (revealedCard && countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (revealedCard && countdown === 0) {
      onConfirm(selectedCardIndex);
    }
  }, [revealedCard, countdown, selectedCardIndex, onConfirm]);

  const handleDone = () => {
    onConfirm(selectedCardIndex);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-slate-950 border border-emerald-800/60 rounded-3xl p-6 max-w-sm w-full shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-900/50 border border-emerald-700/50 flex items-center justify-center">
                <Eye className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-bold text-emerald-300">Peeking Your Card</h3>
                <p className="text-xs text-slate-400">Card 7 — Position {selectedCardIndex + 1}</p>
              </div>
            </div>
            {!revealedCard && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onCancel}
                className="text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Card reveal */}
          {revealedCard ? (
            <div className="flex flex-col items-center gap-4 py-3">
              <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 shadow-2xl glow-emerald">
                <PlayingCard
                  card={revealedCard}
                  faceUp={true}
                  size="lg"
                  animateFlip={true}
                />
              </div>

              {/* Animated Countdown Progress Ring */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-700/80 shadow-md">
                <div className="relative w-5 h-5 flex items-center justify-center">
                  <svg className="w-5 h-5 -rotate-90">
                    <circle
                      cx="10"
                      cy="10"
                      r="8"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      className="text-slate-800"
                      fill="none"
                    />
                    <circle
                      cx="10"
                      cy="10"
                      r="8"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      className="text-amber-400 transition-all duration-1000"
                      fill="none"
                      strokeDasharray={50.2}
                      strokeDashoffset={50.2 * (1 - countdown / 4)}
                    />
                  </svg>
                  <span className="absolute text-[9px] font-bold text-amber-400">{countdown}</span>
                </div>
                <span className="text-xs text-slate-300 font-medium">Facing down automatically</span>
              </div>

              <Button
                onClick={handleDone}
                variant="emerald"
                size="lg"
                className="w-full mt-1 font-bold text-sm rounded-xl shadow-lg"
              >
                <Check className="w-4 h-4" />
                Got it! Face Down
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-400">Revealing card...</p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function PeekOwnModal(props: PeekOwnModalProps) {
  if (!props.open) return null;
  return <PeekOwnModalContent {...props} />;
}
