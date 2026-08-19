"use client";
// ============================================================================
// OpponentArea — Displays opponents in a circular / round-table seating order
// ============================================================================

import { LastActionInfo, Player } from "@/lib/game/types";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Crown, ListOrdered, MoveRight } from "lucide-react";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import CardGrid from "./CardGrid";

interface OpponentAreaProps {
  opponents: Player[];
  currentPlayerIndex: number;
  players: Player[]; // All players in game
  myPlayerId?: string; // Current human user's ID
  lastActionInfo?: LastActionInfo | null;
  selectedOpponentId?: string | null;
  selectableOpponents?: boolean;
  selectableCards?: boolean;
  selectedOpponentCardIndex?: number | null;
  onOpponentClick?: (playerId: string) => void;
  onOpponentCardClick?: (playerId: string, cardIndex: number) => void;
  showFaceUp?: boolean;
  className?: string;
}

export default function OpponentArea({
  opponents,
  currentPlayerIndex,
  players,
  myPlayerId,
  lastActionInfo,
  selectedOpponentId,
  selectableOpponents = false,
  selectableCards = false,
  selectedOpponentCardIndex,
  onOpponentClick,
  onOpponentCardClick,
  showFaceUp = false,
  className,
}: OpponentAreaProps) {
  const totalPlayers = players.length;

  const myIndex = useMemo(() => {
    return players.findIndex((p) => p.id === myPlayerId);
  }, [players, myPlayerId]);

  // Order opponents in clockwise turn order starting right after "You"
  const orderedOpponents = useMemo(() => {
    if (myIndex === -1) return opponents;

    return [...opponents].sort((a, b) => {
      const idxA = players.findIndex((p) => p.id === a.id);
      const idxB = players.findIndex((p) => p.id === b.id);
      const distA = (idxA - myIndex + totalPlayers) % totalPlayers;
      const distB = (idxB - myIndex + totalPlayers) % totalPlayers;
      return distA - distB;
    });
  }, [opponents, players, myIndex, totalPlayers]);

  if (opponents.length === 0) return null;

  return (
    <div className={cn("w-full flex flex-col items-center", className)}>
      {/* Clockwise Flow Label for 2+ opponents */}
      {orderedOpponents.length > 1 && (
        <div className="flex items-center gap-1.5 mb-2 px-3 py-1 rounded-full bg-slate-900/60 border border-slate-700/40 text-xs text-slate-400 font-medium">
          <span className="text-emerald-400 font-bold flex items-center gap-1">
            <ListOrdered size={16} /> Play Order (Clockwise)
          </span>
          <span>You</span>
          {orderedOpponents.map((opp) => (
            <span key={opp.id} className="flex items-center gap-1">
              <MoveRight size={16} />
              <span
                className={cn(
                  players[currentPlayerIndex]?.id === opp.id
                    ? "text-emerald-300 font-bold"
                    : "text-slate-300",
                )}
              >
                {opp.name}
              </span>
            </span>
          ))}
        </div>
      )}

      {/* Circular / Horseshoe Table Layout */}
      <div
        className={cn(
          "w-full flex items-start justify-center gap-4 md:gap-8 px-2",
          orderedOpponents.length === 1 && "justify-center",
          orderedOpponents.length === 2 && "justify-around max-w-2xl",
          orderedOpponents.length >= 3 && "justify-between max-w-4xl flex-wrap",
        )}
      >
        {orderedOpponents.map((opponent, i) => {
          const isTurn = players[currentPlayerIndex]?.id === opponent.id;
          const isSelected = selectedOpponentId === opponent.id;
          const oppGlobalIndex = players.findIndex((p) => p.id === opponent.id);
          const turnNumber =
            myIndex !== -1
              ? ((oppGlobalIndex - myIndex + totalPlayers) % totalPlayers) + 1
              : i + 2;

          // Check if this opponent recently swapped a card
          const isRecentSwapper =
            lastActionInfo?.playerId === opponent.id &&
            lastActionInfo.actionType === "SWAP_WITH_GRID";
          const highlightedSlot = isRecentSwapper
            ? (lastActionInfo.cardIndex ?? null)
            : null;

          return (
            <motion.div
              key={opponent.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.08, duration: 0.3 }}
              className={cn(
                "flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all relative",
                isTurn
                  ? "bg-emerald-950/40 ring-2 ring-emerald-500/70 shadow-lg shadow-emerald-950/50 turn-ring"
                  : "bg-slate-900/40 border border-slate-800/60 hover:border-slate-700/80",
                isSelected &&
                  "bg-blue-950/40 ring-2 ring-blue-400/80 shadow-lg",
                selectableOpponents &&
                  !isSelected &&
                  "cursor-pointer hover:bg-slate-800/50",
              )}
              onClick={() => {
                if (selectableOpponents && onOpponentClick) {
                  onOpponentClick(opponent.id);
                }
              }}
            >
              {/* Play Order Badge */}
              <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <Badge
                  variant="outline"
                  className={cn(
                    "px-2 py-0.5 h-auto text-[10px] font-bold uppercase tracking-wider rounded-full border",
                    isTurn
                      ? "bg-emerald-900/60 border-emerald-500/60 text-emerald-300"
                      : "bg-slate-800/60 border-slate-700/50 text-slate-400",
                  )}
                >
                  Turn #{turnNumber} {turnNumber === 2 && "(Next)"}
                </Badge>
              </div>

              {/* Player Avatar & Name */}
              <div className="flex items-center gap-1.5">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold border-2 shadow-sm shrink-0"
                  style={{
                    backgroundColor: `${opponent.color}20`,
                    borderColor: `${opponent.color}60`,
                  }}
                >
                  {opponent.emoji}
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-1">
                    <span
                      className={cn(
                        "text-xs font-bold truncate max-w-24",
                        isTurn ? "text-emerald-300" : "text-slate-200",
                      )}
                    >
                      {opponent.name}
                    </span>
                    {opponent.isHost && (
                      <Crown className="w-3 h-3 text-amber-400 shrink-0" />
                    )}
                  </div>
                </div>
              </div>

              {/* Status indicator */}
              {isTurn ? (
                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Thinking...
                </span>
              ) : (
                <span className="text-[10px] text-slate-500 font-medium">
                  Waiting
                </span>
              )}

              {/* Opponent's 2x2 cards */}
              <CardGrid
                cards={opponent.cards}
                size="sm"
                showFaceUp={showFaceUp}
                highlightedSlot={highlightedSlot}
                selectable={selectableCards}
                selectedIndex={isSelected ? selectedOpponentCardIndex : null}
                onCardClick={(index) => {
                  if (selectableCards && onOpponentCardClick) {
                    onOpponentCardClick(opponent.id, index);
                  }
                }}
              />

              {/* Score (shown at game over) */}
              {opponent.score !== undefined && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="bg-slate-900/90 border border-slate-700 px-2 py-0.5 rounded-full shadow-md mt-0.5"
                >
                  <span className="text-[11px] font-black text-amber-300 font-mono">
                    {opponent.score} pts
                  </span>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
