"use client";
// ============================================================================
// BlindSwapModal — Card 9 ability: Confirmation modal after selecting cards
// on the board
// ============================================================================

import { Card, Player } from "@/lib/game/types";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Shuffle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import CardGrid from "../CardGrid";

interface BlindSwapModalProps {
  myCards: Card[];
  opponents: Player[];
  ownCardIndex: number;
  targetPlayerId: string;
  targetCardIndex: number;
  onConfirm: (
    ownCardIndex: number,
    targetPlayerId: string,
    targetCardIndex: number,
  ) => void;
  onCancel: () => void;
  open: boolean;
}

export default function BlindSwapModal({
  myCards,
  opponents,
  ownCardIndex,
  targetPlayerId,
  targetCardIndex,
  onConfirm,
  onCancel,
  open,
}: BlindSwapModalProps) {
  if (!open) return null;

  const selectedOpponent = opponents.find((o) => o.id === targetPlayerId);
  if (!selectedOpponent) return null;

  const handleConfirm = () => {
    onConfirm(ownCardIndex, targetPlayerId, targetCardIndex);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-slate-900 border border-purple-800/50 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-900/50 flex items-center justify-center">
                <Shuffle className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="font-bold text-purple-300">Confirm Blind Swap</h3>
                <p className="text-xs text-slate-400">
                  Card 9 — Swap your card with {selectedOpponent.name}&apos;s
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onCancel}
              className="text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Visual Side-by-Side Swap Confirmation */}
          <div className="flex flex-col items-center gap-4 py-1">
            <div className="w-full flex items-center justify-around gap-2 bg-slate-950/60 p-3 rounded-2xl border border-purple-900/40">
              {/* Your Hand Miniature */}
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-300">
                  You
                </span>
                <CardGrid
                  cards={myCards}
                  highlightedSlot={ownCardIndex}
                  size="sm"
                />
              </div>

              {/* Animated Swap Direction */}
              <div className="flex flex-col items-center gap-1">
                <div className="w-8 h-8 rounded-full bg-purple-900/60 border border-purple-500/50 flex items-center justify-center shadow-lg">
                  <Shuffle className="w-4 h-4 text-purple-300 animate-pulse" />
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-purple-400">
                  Swap
                </span>
              </div>

              {/* Opponent's Hand Miniature */}
              <div className="flex flex-col items-center gap-1.5">
                <div className="flex items-center gap-1">
                  <span className="text-xs">{selectedOpponent.emoji}</span>
                  <span className="text-[11px] font-bold text-slate-300 truncate max-w-16">
                    {selectedOpponent.name}
                  </span>
                </div>
                <CardGrid
                  cards={selectedOpponent.cards}
                  highlightedSlot={targetCardIndex}
                  size="sm"
                />
              </div>
            </div>

            <Button
              onClick={handleConfirm}
              variant="purple"
              size="xl"
              className="w-full font-bold shadow-lg"
            >
              <Check className="w-4 h-4" />
              Confirm Blind Swap
            </Button>

            <Button
              onClick={onCancel}
              variant="outline"
              size="default"
              className="w-full text-slate-400 hover:text-slate-200 border-slate-700 hover:bg-slate-800"
            >
              Cancel — Pick Different Cards
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
