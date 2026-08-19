"use client";
// ============================================================================
// DiscardPile — Face-up discard pile with interactive history inspection
// ============================================================================

import { getCardPoints } from "@/lib/game/scoring";
import { Card } from "@/lib/game/types";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDownToLine, History, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PlayingCard from "./PlayingCard";

interface DiscardPileProps {
  cards: Card[];
  onClick?: () => void;
  disabled?: boolean;
  canDraw?: boolean;
  isDiscardTarget?: boolean;
  className?: string;
}

export default function DiscardPile({
  cards,
  onClick,
  disabled = false,
  canDraw = false,
  isDiscardTarget = false,
  className,
}: DiscardPileProps) {
  const [showHistory, setShowHistory] = useState(false);
  const topCard = cards[0] || null;
  const hasCards = cards.length > 0;
  const canDrawFromDiscard = canDraw && hasCards && !disabled;

  const handlePileClick = () => {
    if (canDrawFromDiscard && onClick) {
      onClick();
    } else if (hasCards) {
      setShowHistory(true);
    }
  };

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className="relative group">
        <motion.div
          className={cn(
            "card-size-lg select-none relative rounded-lg transition-transform",
            isDiscardTarget &&
              "ring-2 ring-emerald-400/80 ring-dashed shadow-lg shadow-emerald-500/20 animate-pulse",
            canDrawFromDiscard
              ? "card-hoverable glow-emerald ring-2 ring-emerald-400/60 cursor-pointer"
              : hasCards
                ? "hover:scale-105 cursor-pointer"
                : "cursor-default",
          )}
          onClick={handlePileClick}
          whileHover={hasCards ? { y: -3 } : undefined}
          whileTap={hasCards ? { scale: 0.96 } : undefined}
        >
          {topCard ? (
            <PlayingCard
              card={topCard}
              faceUp={true}
              size="lg"
              animateFlip={false}
            />
          ) : (
            <div className="w-full h-full rounded-lg border-2 border-dashed border-slate-700/60 flex flex-col items-center justify-center bg-slate-900/40 p-2 text-center">
              <span className="text-slate-500 text-xs font-semibold">
                Discard
              </span>
              <span className="text-slate-600 text-[10px]">(Empty)</span>
            </div>
          )}
        </motion.div>

        {/* History button badge */}
        {hasCards && (
          <Button
            variant="outline"
            size="xs"
            onClick={(e) => {
              e.stopPropagation();
              setShowHistory(true);
            }}
            className="absolute -right-2 -top-2 h-5 px-2 py-0 rounded-full bg-slate-800 border-slate-600 shadow-lg flex items-center gap-1 hover:bg-slate-700 hover:border-emerald-500 z-10 text-[10px] text-slate-300 font-medium"
            title="View full discard history"
          >
            <History className="w-3 h-3 text-emerald-400" />
            <span>{cards.length}</span>
          </Button>
        )}
      </div>

      {/* Label & Actions */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-1">
          <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Discard
          </p>
          {hasCards && (
            <Button
              variant="link"
              size="xs"
              onClick={() => setShowHistory(true)}
              className="text-[10px] text-emerald-400 hover:underline p-0 h-auto ml-1 font-medium"
            >
              (History)
            </Button>
          )}
        </div>
        {canDrawFromDiscard && (
          <p className="text-[10px] text-emerald-400 font-medium animate-pulse mt-0.5">
            Click to take
          </p>
        )}
      </div>

      {/* Full Discard History Modal */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
            onClick={() => setShowHistory(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl max-h-[85vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center">
                    <History className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-200 text-sm">
                      Discard Pile History
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {cards.length} cards discarded (newest on top)
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setShowHistory(false)}
                  className="rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Cards List in Reverse Chronological Order */}
              <div className="flex-1 overflow-y-auto py-4 space-y-2">
                {cards.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-xs">
                    No cards have been discarded yet.
                  </div>
                ) : (
                  cards.map((card, i) => {
                    const isTop = i === 0;
                    const points = getCardPoints(card);

                    return (
                      <div
                        key={`${card.id}-${i}`}
                        className={cn(
                          "flex items-center justify-between p-2.5 rounded-2xl border transition-all",
                          isTop
                            ? "bg-emerald-950/30 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30"
                            : "bg-slate-900/60 border-slate-800/80",
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              "text-xs font-mono font-bold w-6 text-center",
                              isTop ? "text-emerald-400" : "text-slate-500",
                            )}
                          >
                            #{i + 1}
                          </span>

                          <div className="scale-75 origin-left -my-3">
                            <PlayingCard
                              card={card}
                              faceUp={true}
                              size="sm"
                              animateFlip={false}
                            />
                          </div>

                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-200">
                              {card.rank} of {card.suit}
                            </span>
                            {isTop && (
                              <Badge variant="outline" className="text-[10px] text-emerald-400 font-semibold border-emerald-500/40 bg-emerald-950/60 px-1.5 py-0 h-4 w-fit">
                                ★ TOP CARD (Draw available)
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="text-right pr-2">
                          <span className="text-xs font-bold text-amber-300 font-mono">
                            {points} pts
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Draw Action if available */}
              {canDraw && topCard && !disabled && (
                <div className="pt-3 border-t border-slate-800">
                  <Button
                    onClick={() => {
                      setShowHistory(false);
                      onClick?.();
                    }}
                    variant="emerald"
                    size="xl"
                    className="w-full font-bold text-sm shadow-lg"
                  >
                    <ArrowDownToLine className="w-4 h-4" />
                    <span>
                      Draw Top Card ({topCard.rank} of {topCard.suit})
                    </span>
                  </Button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
