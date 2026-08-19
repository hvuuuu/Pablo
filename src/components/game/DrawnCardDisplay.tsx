"use client";
// ============================================================================
// DrawnCardDisplay — Shows the card the player just drew with throw animation
// ============================================================================

import { SPECIAL_CARDS } from "@/lib/game/constants";
import { Card } from "@/lib/game/types";
import { cn } from "@/lib/utils";
import { motion, PanInfo, useAnimation } from "framer-motion";
import { ArrowDown, ArrowUp, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PlayingCard from "./PlayingCard";

interface DrawnCardDisplayProps {
  card: Card;
  fromPile: boolean; // true = draw pile, false = discard pile
  onSwap?: () => void; // (swap target selected separately via grid click)
  onDiscard?: () => void;
  className?: string;
}

export default function DrawnCardDisplay({
  card,
  fromPile,
  onDiscard,
  className,
}: DrawnCardDisplayProps) {
  const [isThrowing, setIsThrowing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const controls = useAnimation();
  const isSpecial = SPECIAL_CARDS[card.rank];

  // Handle throwing animation when dragged up or flicked
  const handleDragEnd = async (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    setIsDragging(false);
    if (!fromPile || !onDiscard || isThrowing) return;

    // Trigger throw if dragged upward past -40px or flicked upward fast (velocity < -200)
    if (info.offset.y < -40 || info.velocity.y < -200) {
      triggerThrowAnimation();
    } else {
      // Snap back smoothly
      controls.start({
        x: 0,
        y: 0,
        rotate: 0,
        scale: 1,
        transition: { type: "spring", stiffness: 400, damping: 25 },
      });
    }
  };

  const triggerThrowAnimation = async () => {
    if (isThrowing || !onDiscard) return;
    setIsThrowing(true);

    // Dynamic flight curve up towards Discard Pile with rotation and scale
    await controls.start({
      y: -160,
      x: 30,
      rotate: 20,
      scale: 0.85,
      opacity: 0.3,
      transition: { duration: 0.28, ease: [0.2, 0.8, 0.2, 1] },
    });

    onDiscard();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -25, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 25, scale: 0.9 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn(
        "flex flex-col items-center gap-2 p-3 rounded-2xl border bg-slate-950/90 backdrop-blur-md shadow-2xl z-20",
        "border-emerald-500/30 ring-1 ring-emerald-500/20",
        className,
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-xs text-emerald-300 font-bold uppercase tracking-wider">
          Drawn from {fromPile ? "Deck" : "Discard"}
        </span>
      </div>

      {/* Draggable & Throw-Animated Card Wrapper */}
      <div className="relative my-1">
        <motion.div
          animate={controls}
          drag={fromPile && Boolean(onDiscard) && !isThrowing}
          dragConstraints={{ top: -200, bottom: 50, left: -60, right: 60 }}
          dragElastic={0.2}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={handleDragEnd}
          whileDrag={{ scale: 1.06, rotate: -4, cursor: "grabbing" }}
          className={cn(
            "relative touch-none select-none",
            fromPile &&
              onDiscard &&
              !isThrowing &&
              "cursor-grab active:cursor-grabbing hover:scale-102 transition-transform",
          )}
        >
          <PlayingCard card={card} faceUp size="lg" animateFlip={false} />

          {/* Swipe-Up Prompt Glow Overlay while dragging up */}
          {isDragging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute -top-7 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px] uppercase tracking-wider whitespace-nowrap shadow-lg flex items-center gap-1 glow-emerald pointer-events-none"
            >
              <ArrowUp className="w-3 h-3" /> Release to Throw
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Special Ability Pill */}
      {isSpecial && fromPile && (
        <Badge
          variant="outline"
          className="text-[11px] text-amber-300 font-bold px-2.5 py-1 bg-amber-950/80 border-amber-500/50 rounded-full shadow-md flex items-center gap-1 glow-gold"
        >
          <Sparkles className="w-3 h-3 text-amber-400" />
          Special:{" "}
          {card.rank === "7"
            ? "Peek Own"
            : card.rank === "8"
              ? "Peek Opponent"
              : "Blind Swap"}
        </Badge>
      )}

      {/* Throw Action Buttons & Gestures */}
      <div className="flex flex-col items-center gap-2 w-full mt-0.5">
        {fromPile && onDiscard && (
          <Button
            onClick={triggerThrowAnimation}
            disabled={isThrowing}
            variant="outline"
            size="sm"
            className="w-full h-9 text-xs font-bold text-slate-200 bg-slate-800/90 hover:bg-slate-700 hover:text-white border-slate-600/80 rounded-xl flex items-center justify-center gap-1.5 shadow-md active:scale-95 group"
          >
            <ArrowUp className="w-3.5 h-3.5 text-emerald-400 group-hover:-translate-y-0.5 transition-transform" />
            <span>
              Throw to Discard{" "}
              <span className="text-[10px] text-slate-400 font-normal">
                (or swipe up)
              </span>
            </span>
          </Button>
        )}

        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
          <ArrowDown className="w-3 h-3 text-slate-500" />
          <span>Or tap a card below to swap</span>
        </div>
      </div>
    </motion.div>
  );
}
