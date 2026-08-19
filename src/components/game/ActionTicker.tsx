"use client";
// ============================================================================
// ActionTicker — Floating live gameplay notification banner for tracking actions
// ============================================================================

import { LastActionInfo, Player } from "@/lib/game/types";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeftRight,
  Layers,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";

interface ActionTickerProps {
  lastActionInfo?: LastActionInfo | null;
  players: Player[];
  className?: string;
}

export default function ActionTicker({
  lastActionInfo,
  players,
  className,
}: ActionTickerProps) {
  const [dismissedTimestamp, setDismissedTimestamp] = useState<number | null>(
    null,
  );

  useEffect(() => {
    if (!lastActionInfo) return;

    const timer = setTimeout(() => {
      setDismissedTimestamp(lastActionInfo.timestamp);
    }, 3800);

    return () => clearTimeout(timer);
  }, [lastActionInfo?.timestamp, lastActionInfo]);

  const isVisible = Boolean(
    lastActionInfo && lastActionInfo.timestamp !== dismissedTimestamp,
  );

  if (!lastActionInfo || !isVisible) return null;

  const currentAction = lastActionInfo;
  const player = players.find((p) => p.id === currentAction.playerId);
  const playerName = currentAction.playerName || player?.name || "Player";

  const getActionDetails = () => {
    switch (currentAction.actionType) {
      case "DRAW_FROM_PILE":
        return {
          icon: <Layers className="w-4 h-4 text-blue-400" />,
          title: "Drew Card",
          description: `${playerName} drew from the Deck`,
          badgeClass: "bg-blue-950/80 border-blue-500/40 text-blue-300",
        };
      case "DRAW_FROM_DISCARD":
        return {
          icon: <Layers className="w-4 h-4 text-emerald-400" />,
          title: "Drew from Discard",
          description: `${playerName} took the top discard card`,
          badgeClass:
            "bg-emerald-950/80 border-emerald-500/40 text-emerald-300",
        };
      case "SWAP_WITH_GRID":
        return {
          icon: <ArrowLeftRight className="w-4 h-4 text-amber-400" />,
          title: "Swapped Card",
          description: `${playerName} swapped a hand card`,
          badgeClass: "bg-amber-950/80 border-amber-500/40 text-amber-300",
        };
      case "DISCARD_DRAWN":
        return {
          icon: <Trash2 className="w-4 h-4 text-slate-400" />,
          title: "Discarded",
          description: `${playerName} threw card into discard pile`,
          badgeClass: "bg-slate-900/80 border-slate-700/50 text-slate-300",
        };
      case "CALL_PABLO":
        return {
          icon: (
            <AlertCircle className="w-4 h-4 text-amber-400 animate-bounce" />
          ),
          title: "PABLO Called!",
          description: `📢 ${playerName} called PABLO! Final round triggered!`,
          badgeClass: "bg-amber-950 border-amber-400 text-amber-200 glow-gold",
        };
      case "SPECIAL":
        return {
          icon: <Sparkles className="w-4 h-4 text-purple-400" />,
          title: "Special Ability",
          description: `${playerName} used a special ability!`,
          badgeClass: "bg-purple-950/80 border-purple-500/40 text-purple-300",
        };
      default:
        return {
          icon: <Sparkles className="w-4 h-4 text-emerald-400" />,
          title: "Action",
          description: `${playerName} played`,
          badgeClass: "bg-slate-900 border-slate-700 text-slate-300",
        };
    }
  };

  const details = getActionDetails();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentAction.timestamp}
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -15, scale: 0.95 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        onClick={() => setDismissedTimestamp(currentAction.timestamp)}
        className={cn(
          "px-4 py-2 rounded-2xl border backdrop-blur-md shadow-2xl flex items-center gap-3 cursor-pointer z-30 select-none max-w-sm w-full mx-auto",
          details.badgeClass,
          className,
        )}
      >
        {/* Player avatar */}
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-sm border shrink-0 shadow-sm"
          style={{
            backgroundColor: player?.color ? `${player.color}25` : undefined,
            borderColor: player?.color ? `${player.color}70` : undefined,
          }}
        >
          {player?.emoji || "👤"}
        </div>

        {/* Action description */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            {details.icon}
            <span className="text-xs font-bold truncate">{details.title}</span>
          </div>
          <p className="text-[11px] text-slate-300/90 truncate font-medium mt-0.5">
            {details.description}
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
