"use client";
// ============================================================================
// GameBoard — Main game layout orchestrator
// ============================================================================

import { useGameState } from "@/hooks/useGameState";
import { useSounds } from "@/hooks/useSounds";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Check,
  Eye,
  MessageSquare,
  Search,
  Shuffle,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import ActionLog from "./ActionLog";
import ActionTicker from "./ActionTicker";
import CardGrid from "./CardGrid";
import DiscardPile from "./DiscardPile";
import DrawnCardDisplay from "./DrawnCardDisplay";
import DrawPile from "./DrawPile";
import GameOverOverlay from "./GameOverOverlay";
import BlindSwapModal from "./modals/BlindSwapModal";
import PeekOpponentModal from "./modals/PeekOpponentModal";
import PeekOwnModal from "./modals/PeekOwnModal";
import OpponentArea from "./OpponentArea";
import PabloButton from "./PabloButton";
import TurnIndicator from "./TurnIndicator";

interface GameBoardProps {
  onGoHome?: () => void;
}

export default function GameBoard({ onGoHome }: GameBoardProps) {
  const {
    store,
    currentPlayer,
    isMyTurn,
    myCards,
    opponents,
    phase,
    turnStep,
    specialAbility,
    drawnCard,
    drawPileCount,
    actionLog,
    isPabloCalled,
    pabloCaller,
    sendAction,
    startLocalGame,
  } = useGameState();

  const { play, setEnabled } = useSounds();
  const [soundOn, setSoundOn] = useState(true);
  const [showLog, setShowLog] = useState(false);
  const [selectedGridIndices, setSelectedGridIndices] = useState<number[]>([]);
  const gameState = store.gameState;

  // --- Special Ability On-Board Selection State ---
  const [specialSelection, setSpecialSelection] = useState<{
    ownCardIndex: number | null;
    targetPlayerId: string | null;
    targetCardIndex: number | null;
  }>({ ownCardIndex: null, targetPlayerId: null, targetCardIndex: null });
  const [showSpecialConfirm, setShowSpecialConfirm] = useState(false);

  // Reset special selection when the special ability phase ends
  const prevSpecialAbilityRef = useRef(specialAbility);
  useEffect(() => {
    if (prevSpecialAbilityRef.current && !specialAbility) {
      setSpecialSelection({ ownCardIndex: null, targetPlayerId: null, targetCardIndex: null });
      setShowSpecialConfirm(false);
    }
    prevSpecialAbilityRef.current = specialAbility;
  }, [specialAbility]);

  // Derived: is the player currently in a special ability selection phase (on-board)?
  const isSpecialSelecting = isMyTurn && specialAbility !== null && !showSpecialConfirm;

  // Toggle sound
  const toggleSound = useCallback(() => {
    const newState = !soundOn;
    setSoundOn(newState);
    setEnabled(newState);
  }, [soundOn, setEnabled]);

  // Sound effects on game events
  const prevPhaseRef = useRef(phase);
  useEffect(() => {
    if (phase === "game_over" && prevPhaseRef.current !== "game_over") {
      play("game_over");
    }
    if (isMyTurn && turnStep === "draw_or_pablo") {
      play("turn_start");
    }
    prevPhaseRef.current = phase;
  }, [phase, isMyTurn, turnStep, play]);

  // --- Preview Phase Handlers ---
  const handlePreviewPeek = useCallback(
    (index: number) => {
      play("card_flip");
      sendAction("PREVIEW_PEEK", { cardIndex: index });
    },
    [sendAction, play],
  );

  // --- Draw Handlers ---
  const handleDrawFromPile = useCallback(() => {
    if (!isMyTurn || turnStep !== "draw_or_pablo") return;
    play("card_deal");
    sendAction("DRAW_FROM_PILE");
  }, [isMyTurn, turnStep, sendAction, play]);

  const handleDrawFromDiscard = useCallback(() => {
    if (!isMyTurn || turnStep !== "draw_or_pablo") return;
    play("card_deal");
    sendAction("DRAW_FROM_DISCARD");
  }, [isMyTurn, turnStep, sendAction, play]);

  // --- Multi-card grid selection & swap / match handlers ---
  const handleGridCardClick = useCallback(
    (index: number) => {
      // During preview phase — all players can peek at their own cards (strictly max 2)
      if (phase === "preview") {
        const peeksUsed =
          gameState?.previewPeeksUsed[currentPlayer?.id || ""] || 0;
        const alreadyPeeked = currentPlayer?.peekedCardIndices || [];
        if (alreadyPeeked.includes(index)) return;
        if (peeksUsed >= 2 || alreadyPeeked.length >= 2) {
          toast.warning(
            "You can only peek at exactly 2 cards at the start of the game!",
            {
              duration: 3000,
            },
          );
          return;
        }
        handlePreviewPeek(index);
        return;
      }

      if (!isMyTurn) return;

      // --- Special ability on-board selection ---
      if (specialAbility === "peek_own" && turnStep === "special_ability") {
        play("button_click");
        setSpecialSelection({ ownCardIndex: index, targetPlayerId: null, targetCardIndex: null });
        setShowSpecialConfirm(true);
        return;
      }

      if (specialAbility === "blind_swap" && turnStep === "special_ability") {
        play("button_click");
        setSpecialSelection((prev) => ({ ...prev, ownCardIndex: index }));
        return;
      }

      // During draw phase — toggle selection for single or multi-card match discard
      if (turnStep === "drawn_from_pile" || turnStep === "drawn_from_discard") {
        play("button_click");
        setSelectedGridIndices((prev) =>
          prev.includes(index)
            ? prev.filter((i) => i !== index)
            : [...prev, index],
        );
      }
    },
    [
      isMyTurn,
      phase,
      turnStep,
      specialAbility,
      handlePreviewPeek,
      play,
      gameState?.previewPeeksUsed,
      currentPlayer?.id,
      currentPlayer?.peekedCardIndices,
    ],
  );

  const handleConfirmSwapOrMatch = useCallback(() => {
    if (selectedGridIndices.length === 0) return;
    play("card_place");
    sendAction("SWAP_WITH_GRID", {
      cardIndices: selectedGridIndices,
      cardIndex: selectedGridIndices[0],
    });
    setSelectedGridIndices([]);
  }, [selectedGridIndices, sendAction, play]);

  const handleDiscard = useCallback(() => {
    if (!isMyTurn || turnStep !== "drawn_from_pile") return;
    play("card_place");
    sendAction("DISCARD_DRAWN");
    setSelectedGridIndices([]);
  }, [isMyTurn, turnStep, sendAction, play]);

  // --- Pablo Call ---
  const handlePabloCall = useCallback(() => {
    if (phase !== "playing" || isPabloCalled) return;
    play("pablo_call");
    sendAction("CALL_PABLO");
  }, [phase, isPabloCalled, sendAction, play]);

  // --- Special Ability Handlers ---
  const handlePeekOwnConfirm = useCallback(
    (cardIndex: number) => {
      play("special_ability");
      sendAction("EXECUTE_PEEK_OWN", { cardIndex });
      setShowSpecialConfirm(false);
      setSpecialSelection({ ownCardIndex: null, targetPlayerId: null, targetCardIndex: null });
    },
    [sendAction, play],
  );

  const requestOpponentPeek = useCallback(
    async (targetPlayerId: string, targetCardIndex: number) => {
      if (!store.roomCode || !store.playerId) return null;
      const response = await fetch("/api/game/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "EXECUTE_PEEK_OPPONENT",
          playerId: store.playerId,
          roomCode: store.roomCode,
          payload: { targetPlayerId, targetCardIndex, revealOnly: true },
        }),
      });
      const data = await response.json();
      return response.ok ? (data.privatePeek?.card ?? null) : null;
    },
    [store.playerId, store.roomCode],
  );

  const handlePeekOpponentConfirm = useCallback(
    (targetPlayerId: string, targetCardIndex: number) => {
      play("special_ability");
      void sendAction("EXECUTE_PEEK_OPPONENT", {
        targetPlayerId,
        targetCardIndex,
      });
      setShowSpecialConfirm(false);
      setSpecialSelection({ ownCardIndex: null, targetPlayerId: null, targetCardIndex: null });
    },
    [sendAction, play],
  );

  const handleBlindSwapConfirm = useCallback(
    (ownCardIndex: number, targetPlayerId: string, targetCardIndex: number) => {
      play("special_ability");
      sendAction("EXECUTE_BLIND_SWAP", {
        cardIndex: ownCardIndex,
        targetPlayerId,
        targetCardIndex,
      });
      setShowSpecialConfirm(false);
      setSpecialSelection({ ownCardIndex: null, targetPlayerId: null, targetCardIndex: null });
    },
    [sendAction, play],
  );

  const handleSkipSpecial = useCallback(() => {
    sendAction("SKIP_SPECIAL");
    setSpecialSelection({ ownCardIndex: null, targetPlayerId: null, targetCardIndex: null });
    setShowSpecialConfirm(false);
  }, [sendAction]);

  const handleCancelSpecialConfirm = useCallback(() => {
    setShowSpecialConfirm(false);
    setSpecialSelection({ ownCardIndex: null, targetPlayerId: null, targetCardIndex: null });
  }, []);

  // --- On-board opponent card click during special ability ---
  const handleSpecialOpponentCardClick = useCallback(
    (playerId: string, cardIndex: number) => {
      if (!isMyTurn || turnStep !== "special_ability") return;

      if (specialAbility === "peek_opponent") {
        play("button_click");
        setSpecialSelection({ ownCardIndex: null, targetPlayerId: playerId, targetCardIndex: cardIndex });
        setShowSpecialConfirm(true);
        return;
      }

      if (specialAbility === "blind_swap" && specialSelection.ownCardIndex !== null) {
        play("button_click");
        setSpecialSelection((prev) => ({ ...prev, targetPlayerId: playerId, targetCardIndex: cardIndex }));
        setShowSpecialConfirm(true);
        return;
      }
    },
    [isMyTurn, turnStep, specialAbility, specialSelection.ownCardIndex, play],
  );

  // --- Play Again / Rematch ---
  const handlePlayAgain = useCallback(() => {
    if (!gameState) return;
    if (
      !store.roomCode ||
      store.roomCode === "DEMO" ||
      store.roomCode === "LOCAL"
    ) {
      startLocalGame(
        gameState.players.map((p) => ({
          ...p,
          cards: [],
          peekedCardIndices: [],
          score: undefined,
        })),
      );
    } else {
      sendAction("REMATCH_READY");
    }
  }, [gameState, store.roomCode, startLocalGame, sendAction]);

  const handleStartNewRound = useCallback(() => {
    sendAction("START_NEW_ROUND");
  }, [sendAction]);

  if (!gameState || !currentPlayer) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-400">Loading game...</p>
      </div>
    );
  }

  const currentTurnPlayer = gameState.players[gameState.currentPlayerIndex];
  const canDraw = isMyTurn && turnStep === "draw_or_pablo";

  const myIndex = gameState.players.findIndex((p) => p.id === currentPlayer.id);
  const currentActiveIndex = gameState.currentPlayerIndex;
  const isCallerTurn = myIndex === currentActiveIndex;
  const turnsNeededForPablo = isCallerTurn
    ? Math.max(1, gameState.players.length - 1)
    : (myIndex - currentActiveIndex + gameState.players.length) %
      gameState.players.length;
  const hasEnoughCardsForPablo =
    gameState.drawPile.length >= turnsNeededForPablo;
  const canCallPablo =
    phase === "playing" && !isPabloCalled && hasEnoughCardsForPablo;
  const isPreview = phase === "preview";
  const previewPeeksRemaining =
    2 - (gameState.previewPeeksUsed[currentPlayer.id] || 0);

  const isDrawnState =
    isMyTurn &&
    (turnStep === "drawn_from_pile" || turnStep === "drawn_from_discard");

  // Determine which special ability banner to show
  const specialBannerConfig = isSpecialSelecting ? (
    specialAbility === "peek_own" ? {
      icon: <Eye className="w-4 h-4" />,
      color: "emerald" as const,
      title: "👁️ Peek at Your Card",
      description: "Tap one of your cards below to peek at it",
      borderClass: "border-emerald-500/50",
      bgClass: "bg-emerald-950/60",
      textClass: "text-emerald-300",
    } : specialAbility === "peek_opponent" ? {
      icon: <Search className="w-4 h-4" />,
      color: "blue" as const,
      title: "🔍 Peek at Opponent's Card",
      description: "Tap one of an opponent's cards above to peek at it",
      borderClass: "border-blue-500/50",
      bgClass: "bg-blue-950/60",
      textClass: "text-blue-300",
    } : specialAbility === "blind_swap" ? {
      icon: <Shuffle className="w-4 h-4" />,
      color: "purple" as const,
      title: "🔀 Blind Swap",
      description: specialSelection.ownCardIndex === null
        ? "Step 1: Tap one of YOUR cards below"
        : "Step 2: Now tap one of an opponent's cards above",
      borderClass: "border-purple-500/50",
      bgClass: "bg-purple-950/60",
      textClass: "text-purple-300",
    } : null
  ) : null;

  // Find selected opponent info for PeekOpponentModal
  const selectedOpponentForPeek = specialSelection.targetPlayerId
    ? opponents.find((o) => o.id === specialSelection.targetPlayerId)
    : null;

  return (
    <div className="relative w-full h-full min-h-screen flex flex-col table-felt overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-black/40 backdrop-blur-sm border-b border-white/5 z-20">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400 font-semibold">
            Room: {gameState.roomCode}
          </span>
          <span className="text-xs text-slate-600">•</span>
          <span className="text-xs text-slate-400">
            Round {gameState.roundNumber}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger render={
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setShowLog(!showLog)}
                className={cn(
                  showLog
                    ? "bg-emerald-900/50 text-emerald-400 hover:bg-emerald-900/70"
                    : "text-slate-400 hover:text-slate-200",
                )}
              />
            }>
              <MessageSquare className="w-4 h-4" />
            </TooltipTrigger>
            <TooltipContent>Activity Log</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger render={
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={toggleSound}
                className="text-slate-400 hover:text-slate-200"
              />
            }>
              {soundOn ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </TooltipTrigger>
            <TooltipContent>{soundOn ? "Mute audio" : "Unmute audio"}</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Spectator Waiting Banner */}
      {currentPlayer?.isWaiting && (
        <div className="w-full bg-blue-950/90 border-b border-blue-500/40 px-4 py-2 text-center text-xs text-blue-200 font-semibold backdrop-blur-md z-20 flex items-center justify-center gap-2">
          <span>
            👀 Game in progress — You are spectating and will be dealt in when
            Round {(gameState.roundNumber || 1) + 1} starts!
          </span>
        </div>
      )}

      {/* Live Action Ticker for instant move tracking */}
      <div className="w-full px-4 pt-1 z-20">
        <ActionTicker
          lastActionInfo={gameState.lastActionInfo}
          players={gameState.players}
        />
      </div>

      {/* Turn indicator & preview banner */}
      <div className="px-4 py-2 z-10">
        {isPreview ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <p className="text-emerald-300 font-bold text-sm">
              👀 Preview Phase — Peek at {previewPeeksRemaining} more card
              {previewPeeksRemaining !== 1 ? "s" : ""}!
            </p>
            <div className="w-full max-w-xs mx-auto mt-1.5 h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-700/50">
              <motion.div
                className="h-full bg-emerald-500 rounded-full"
                initial={{ width: "100%" }}
                animate={{
                  width: `${(gameState.previewTimeLeft / 15) * 100}%`,
                }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {gameState.previewTimeLeft}s remaining
            </p>
          </motion.div>
        ) : (
          <TurnIndicator
            playerName={currentTurnPlayer?.name || ""}
            isMyTurn={isMyTurn}
            timeLimit={gameState.turnTimeLimit}
            turnStartedAt={gameState.turnStartedAt}
            isPabloCalled={isPabloCalled}
            pabloCallerName={pabloCaller?.name}
          />
        )}
      </div>

      {/* Main game area */}
      <div className="flex-1 flex flex-col items-center justify-between px-4 py-2 z-10">
        {/* Opponents */}
        <OpponentArea
          opponents={opponents}
          currentPlayerIndex={gameState.currentPlayerIndex}
          players={gameState.players}
          myPlayerId={currentPlayer.id}
          lastActionInfo={gameState.lastActionInfo}
          showFaceUp={phase === "game_over" || phase === "reveal"}
          className="mb-2"
          selectableCards={
            isSpecialSelecting && (
              specialAbility === "peek_opponent" ||
              (specialAbility === "blind_swap" && specialSelection.ownCardIndex !== null)
            )
          }
          onOpponentCardClick={handleSpecialOpponentCardClick}
        />

        {/* Center — Piles & Pablo */}
        <div className="flex items-center justify-center gap-6 md:gap-10 my-3">
          <DrawPile
            count={drawPileCount}
            onClick={handleDrawFromPile}
            disabled={!canDraw}
          />

          {/* Pablo button (centered between piles) */}
          <div className="flex flex-col items-center gap-1.5">
            <PabloButton
              onClick={handlePabloCall}
              disabled={!canCallPablo}
              active={canCallPablo}
            />
            {phase === "playing" &&
              !isPabloCalled &&
              !hasEnoughCardsForPablo && (
                <span className="text-[10px] text-amber-400 font-medium px-2 py-0.5 bg-slate-900/90 rounded-full border border-amber-500/40 shadow-sm whitespace-nowrap">
                  Need ≥ {turnsNeededForPablo} cards in deck to call (
                  {gameState.drawPile.length} left)
                </span>
              )}
          </div>

          <DiscardPile
            cards={gameState.discardPile}
            onClick={handleDrawFromDiscard}
            disabled={!canDraw}
            canDraw={canDraw}
            isDiscardTarget={isMyTurn && turnStep === "drawn_from_pile"}
          />
        </div>

        {/* Drawn card display */}
        <AnimatePresence>
          {isMyTurn &&
            drawnCard &&
            (turnStep === "drawn_from_pile" ||
              turnStep === "drawn_from_discard") && (
              <DrawnCardDisplay
                card={drawnCard}
                fromPile={turnStep === "drawn_from_pile"}
                onDiscard={
                  turnStep === "drawn_from_pile" ? handleDiscard : undefined
                }
                className="mb-2"
              />
            )}
        </AnimatePresence>

        {/* My cards area */}
        <div className="mt-auto pb-4 w-full max-w-md flex flex-col items-center">
          {/* Special Ability On-Board Selection Banner */}
          <AnimatePresence>
            {specialBannerConfig && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className={cn(
                  "w-full mb-3 p-3 rounded-2xl bg-slate-950/90 border shadow-2xl backdrop-blur-md flex flex-col items-center gap-2",
                  specialBannerConfig.borderClass,
                )}
              >
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-7 h-7 rounded-xl flex items-center justify-center",
                    specialBannerConfig.bgClass,
                  )}>
                    {specialBannerConfig.icon}
                  </div>
                  <div>
                    <p className={cn("text-sm font-bold", specialBannerConfig.textClass)}>
                      {specialBannerConfig.title}
                    </p>
                    <p className="text-xs text-slate-400">
                      {specialBannerConfig.description}
                    </p>
                  </div>
                </div>

                {/* Progress indicator for blind swap */}
                {specialAbility === "blind_swap" && (
                  <div className="flex items-center gap-2 mt-1">
                    <div className={cn(
                      "w-2 h-2 rounded-full transition-colors",
                      specialSelection.ownCardIndex !== null ? "bg-purple-400" : "bg-slate-600 animate-pulse",
                    )} />
                    <span className="text-[10px] text-slate-500">→</span>
                    <div className={cn(
                      "w-2 h-2 rounded-full transition-colors",
                      specialSelection.ownCardIndex !== null ? "bg-slate-600 animate-pulse" : "bg-slate-700",
                    )} />
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSkipSpecial}
                  className="w-full mt-1 text-xs text-slate-400 hover:text-slate-200 border-slate-800 hover:bg-slate-900"
                >
                  Skip Ability
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Multi-Select Action Toolbar when player has drawn a card */}
          <AnimatePresence>
            {isDrawnState && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="w-full mb-3 p-3 rounded-2xl bg-slate-950/90 border border-emerald-500/40 shadow-2xl backdrop-blur-md flex flex-col items-center gap-2"
              >
                {selectedGridIndices.length === 0 ? (
                  <p className="text-xs text-emerald-300 font-medium text-center">
                    👉 Click <strong>1 card</strong> to swap, or{" "}
                    <strong>2+ cards</strong> to attempt a matching pair
                    discard!
                  </p>
                ) : selectedGridIndices.length === 1 ? (
                  <div className="flex items-center gap-2 w-full">
                    <Button
                      onClick={handleConfirmSwapOrMatch}
                      variant="emerald"
                      size="lg"
                      className="flex-1 font-bold text-xs uppercase tracking-wider shadow-lg"
                    >
                      <Check className="w-4 h-4" />
                      Swap Selected Card
                    </Button>
                    <Tooltip>
                      <TooltipTrigger render={
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedGridIndices([])}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl"
                        />
                      }>
                        <X className="w-4 h-4" />
                      </TooltipTrigger>
                      <TooltipContent>Clear Selection</TooltipContent>
                    </Tooltip>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1.5 w-full">
                    <div className="flex items-center gap-2 w-full">
                      <Button
                        onClick={handleConfirmSwapOrMatch}
                        variant="amber"
                        size="lg"
                        className="flex-1 font-black text-xs uppercase tracking-wider shadow-lg"
                      >
                        <Sparkles className="w-4 h-4" />
                        Match & Discard ({selectedGridIndices.length} Cards)
                      </Button>
                      <Tooltip>
                        <TooltipTrigger render={
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedGridIndices([])}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl"
                          />
                        }>
                          <X className="w-4 h-4" />
                        </TooltipTrigger>
                        <TooltipContent>Clear Selection</TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-[11px] text-amber-300/90 flex items-center gap-1 text-center font-medium">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      Match = eliminate cards! Mismatch = +1 card penalty!
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-2">
              <span className="text-lg">{currentPlayer.emoji}</span>
              <span className="text-sm font-bold text-emerald-300">
                {currentPlayer.name}
              </span>
              {currentPlayer.score !== undefined && (
                <Badge variant="outline" className="text-sm font-bold text-amber-300 bg-amber-900/40 border-amber-500/30 px-2 py-0.5 h-auto">
                  {currentPlayer.score} pts
                </Badge>
              )}
            </div>

            <CardGrid
              cards={myCards}
              peekedIndices={isPreview ? currentPlayer.peekedCardIndices : []}
              selectedIndices={
                isSpecialSelecting && specialAbility === "blind_swap" && specialSelection.ownCardIndex !== null
                  ? [specialSelection.ownCardIndex]
                  : selectedGridIndices
              }
              selectable={
                (isPreview && previewPeeksRemaining > 0) ||
                isDrawnState ||
                (isSpecialSelecting && (specialAbility === "peek_own" || specialAbility === "blind_swap"))
              }
              onCardClick={handleGridCardClick}
              size="lg"
              showFaceUp={phase === "game_over" || phase === "reveal"}
              label={
                isPreview
                  ? previewPeeksRemaining > 0
                    ? `Click 2 cards to peek (${previewPeeksRemaining} left)`
                    : "2 cards peeked (memorizing...)"
                  : isSpecialSelecting && specialAbility === "peek_own"
                    ? "Tap a card to peek"
                    : isSpecialSelecting && specialAbility === "blind_swap"
                      ? specialSelection.ownCardIndex !== null
                        ? "Your card selected ✓"
                        : "Select your card to swap"
                      : isDrawnState
                        ? selectedGridIndices.length > 0
                          ? `${selectedGridIndices.length} selected`
                          : "Select card(s) to swap or match"
                        : "Your cards"
              }
            />

            {/* Turn hint text */}
            {isMyTurn && turnStep === "draw_or_pablo" && !isPreview && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-emerald-400/80 mt-1 font-medium text-center"
              >
                Draw a card from either pile, or call Pablo!
              </motion.p>
            )}
          </div>
        </div>
      </div>

      {/* Action Log (sidebar) */}
      <AnimatePresence>
        {showLog && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="fixed right-0 top-12 bottom-0 w-72 z-30 p-2"
          >
            <ActionLog entries={actionLog} className="h-full" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Special Ability Confirmation Modals */}
      <PeekOwnModal
        cards={myCards}
        selectedCardIndex={specialSelection.ownCardIndex ?? 0}
        onConfirm={handlePeekOwnConfirm}
        onCancel={handleCancelSpecialConfirm}
        open={showSpecialConfirm && specialAbility === "peek_own" && specialSelection.ownCardIndex !== null}
      />

      <PeekOpponentModal
        targetPlayerId={specialSelection.targetPlayerId ?? ""}
        targetCardIndex={specialSelection.targetCardIndex ?? 0}
        opponentName={selectedOpponentForPeek?.name ?? ""}
        opponentEmoji={selectedOpponentForPeek?.emoji ?? ""}
        onConfirm={handlePeekOpponentConfirm}
        onCancel={handleCancelSpecialConfirm}
        onReveal={requestOpponentPeek}
        open={showSpecialConfirm && specialAbility === "peek_opponent" && specialSelection.targetPlayerId !== null && specialSelection.targetCardIndex !== null}
      />

      <BlindSwapModal
        myCards={myCards}
        opponents={opponents}
        ownCardIndex={specialSelection.ownCardIndex ?? 0}
        targetPlayerId={specialSelection.targetPlayerId ?? ""}
        targetCardIndex={specialSelection.targetCardIndex ?? 0}
        onConfirm={handleBlindSwapConfirm}
        onCancel={handleCancelSpecialConfirm}
        open={showSpecialConfirm && specialAbility === "blind_swap" && specialSelection.ownCardIndex !== null && specialSelection.targetPlayerId !== null && specialSelection.targetCardIndex !== null}
      />

      {/* Game Over Overlay */}
      <GameOverOverlay
        players={gameState.players}
        winnerId={gameState.winnerId}
        pabloCallerId={
          gameState.pabloCallerIndex !== null
            ? gameState.players[gameState.pabloCallerIndex]?.id || null
            : null
        }
        open={phase === "game_over"}
        currentPlayerId={currentPlayer.id}
        isHost={currentPlayer.isHost}
        rematchVotes={gameState.rematchVotes}
        onPlayAgain={handlePlayAgain}
        onStartNewRound={handleStartNewRound}
        onGoHome={onGoHome}
      />
    </div>
  );
}
