'use client';
// ============================================================================
// Game Page — /game/[code]
// Supports both multiplayer (via room code) and local demo mode (/game/demo)
// ============================================================================

import { useEffect, useRef, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { GameProvider, useGameState } from '@/hooks/useGameState';
import GameBoard from '@/components/game/GameBoard';
import { Player, GameState } from '@/lib/game/types';
import { GAME_CONFIG, PLAYER_COLORS, PLAYER_EMOJIS } from '@/lib/game/constants';
import * as engine from '@/lib/game/engine';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getPusherClient, getRoomChannelName } from '@/lib/pusher-client';

function GameInitializer({ code }: { code: string }) {
  const router = useRouter();
  const { store, dispatch, startLocalGame, sendAction } = useGameState();
  const initializedRef = useRef(false);

  const fetchState = useCallback(async () => {
    if (code === 'demo') return;
    const playerId = typeof window !== 'undefined' ? sessionStorage.getItem('pablo_player_id') : null;
    if (!playerId) return;

    try {
      const res = await fetch(`/api/game/state?roomCode=${code}&playerId=${playerId}`);
      const data = await res.json();
      if (res.ok && data.gameState) {
        dispatch({ type: 'SET_GAME_STATE', gameState: data.gameState });
      }
    } catch {
      // A future Pusher event or reconnect will retry.
    }
  }, [code, dispatch]);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const isDemo = code === 'demo';

    if (isDemo) {
      // Local demo mode — create 3 AI players + 1 human
      const demoPlayers: Player[] = [
        {
          id: 'player-you',
          name: (typeof window !== 'undefined' && sessionStorage.getItem('pablo_player_name')) || 'You',
          color: PLAYER_COLORS[0],
          emoji: (typeof window !== 'undefined' && sessionStorage.getItem('pablo_player_emoji')) || '😎',
          cards: [],
          isHost: true,
          isReady: true,
          isConnected: true,
          peekedCardIndices: [],
        },
        {
          id: 'bot-1',
          name: 'Alex',
          color: PLAYER_COLORS[1],
          emoji: PLAYER_EMOJIS[1],
          cards: [],
          isHost: false,
          isReady: true,
          isConnected: true,
          peekedCardIndices: [],
        },
        {
          id: 'bot-2',
          name: 'Sam',
          color: PLAYER_COLORS[2],
          emoji: PLAYER_EMOJIS[2],
          cards: [],
          isHost: false,
          isReady: true,
          isConnected: true,
          peekedCardIndices: [],
        },
      ];

      dispatch({ type: 'SET_ROOM', roomCode: 'DEMO', playerId: 'player-you' });
      startLocalGame(demoPlayers);
    } else {
      // Multiplayer mode
      const playerId = typeof window !== 'undefined' ? sessionStorage.getItem('pablo_player_id') : null;
      if (!playerId) {
        router.push(`/room/${code}`);
        return;
      }

      dispatch({ type: 'SET_ROOM', roomCode: code, playerId });

      // Fetch the initial state. Subsequent updates arrive via Pusher.
      fetchState();
    }
  }, [code, dispatch, fetchState, startLocalGame, router]);

  // Refresh only when another player changes the room. If Pusher is not
  // configured, use a slow fallback so local development remains functional.
  useEffect(() => {
    if (code === 'demo') return;
    const playerId = typeof window !== 'undefined' ? sessionStorage.getItem('pablo_player_id') : null;
    if (!playerId) return;

    const pusher = getPusherClient();
    if (pusher) {
      const channelName = getRoomChannelName(code);
      const channel = pusher.subscribe(channelName);
      const onRoomUpdate = (event: { playerId?: string }) => {
        // The action response already contains the sender's updated state.
        if (event.playerId !== playerId) fetchState();
      };
      channel.bind('room-updated', onRoomUpdate);
      pusher.connection.bind('connected', fetchState);

      return () => {
        channel.unbind('room-updated', onRoomUpdate);
        pusher.connection.unbind('connected', fetchState);
        pusher.unsubscribe(channelName);
      };
    }

    const interval = setInterval(fetchState, 15000);
    return () => clearInterval(interval);
  }, [code, fetchState]);

  // The host advances the server-side preview timer. This replaces the former
  // once-per-second state polling while ensuring a game starts on time.
  useEffect(() => {
    if (code === 'demo') return;
    const gameState = store.gameState;
    if (!gameState || gameState.phase !== 'preview') return;

    const host = gameState.players.find(player => player.isHost);
    if (!host || host.id !== store.playerId) return;

    const elapsed = Date.now() - gameState.turnStartedAt;
    const remainingMs = Math.max(0, GAME_CONFIG.PREVIEW_DURATION * 1000 - elapsed);
    const timer = setTimeout(() => sendAction('END_PREVIEW'), remainingMs);
    return () => clearTimeout(timer);
  }, [code, store.gameState, store.playerId, sendAction]);

  // Auto-skip turn when timer expires
  useEffect(() => {
    if (!store.gameState) return;
    const gs = store.gameState;
    if (gs.phase !== 'playing' && gs.phase !== 'final_round') return;
    if (gs.players[gs.currentPlayerIndex]?.id !== store.playerId) return;

    const elapsed = Math.floor((Date.now() - (gs.turnStartedAt || Date.now())) / 1000);
    const remainingMs = Math.max(500, (gs.turnTimeLimit - elapsed) * 1000);

    const timer = setTimeout(() => {
      sendAction('SKIP_TURN');
    }, remainingMs);

    return () => clearTimeout(timer);
  }, [store.gameState, store.playerId, sendAction]);

  // Bot turns in demo mode (multi-step realistic AI with toasts & card exchange animation)
  useEffect(() => {
    if (code !== 'demo') return;
    if (!store.gameState) return;

    const gs = store.gameState;
    const currentPlayer = gs.players[gs.currentPlayerIndex];
    
    // Only act if it's a bot's turn and game is in progress
    if (!currentPlayer || !currentPlayer.id.startsWith('bot-')) return;
    if (gs.phase !== 'playing' && gs.phase !== 'final_round') return;

    let timeout: NodeJS.Timeout;

    if (gs.turnStep === 'draw_or_pablo') {
      // Step 1: Bot decides to draw from discard (if low card) or pile
      timeout = setTimeout(() => {
        try {
          const topDiscard = gs.discardPile[0];
          const shouldDrawDiscard = topDiscard && getSimpleCardValue(topDiscard) <= 3;

          let drawnState: GameState;
          if (shouldDrawDiscard) {
            drawnState = engine.drawFromDiscard(gs, currentPlayer.id);
            toast.info(`${currentPlayer.name} drew ${topDiscard.rank} from Discard Pile!`, {
              duration: 2500,
            });
          } else {
            drawnState = engine.drawFromPile(gs, currentPlayer.id);
            toast.info(`${currentPlayer.name} drew a card from the Draw Pile.`, {
              duration: 2500,
            });
          }

          dispatch({ type: 'SET_GAME_STATE', gameState: drawnState });
        } catch (err) {
          console.error('Bot draw error:', err);
        }
      }, 1500 + Math.random() * 500);
    } else if (gs.turnStep === 'drawn_from_pile' || gs.turnStep === 'drawn_from_discard') {
      // Step 2: Bot decides to swap with a slot or discard
      timeout = setTimeout(() => {
        try {
          let nextState = gs;
          if (gs.drawnCard) {
            const drawnValue = getSimpleCardValue(gs.drawnCard);

            if (drawnValue <= 5 || gs.turnStep === 'drawn_from_discard') {
              // Swap with a card slot
              const randomIndex = Math.floor(Math.random() * currentPlayer.cards.length);
              const slotName = engine.getSlotName(randomIndex);

              nextState = engine.swapWithGrid(gs, currentPlayer.id, randomIndex);
              toast.info(`🔄 ${currentPlayer.name} exchanged their ${slotName} card!`, {
                duration: 3500,
              });
            } else {
              // Discard it
              nextState = engine.discardDrawn(gs, currentPlayer.id);
              toast.info(`${currentPlayer.name} discarded the drawn card.`, {
                duration: 2000,
              });

              if (nextState.turnStep === 'special_ability') {
                nextState = engine.skipSpecial(nextState, currentPlayer.id);
              }
            }
          }

          dispatch({ type: 'SET_GAME_STATE', gameState: nextState });
        } catch (err) {
          console.error('Bot action error:', err);
        }
      }, 2000);
    }

    return () => clearTimeout(timeout);
  }, [code, store.gameState, dispatch]);

  if (!store.gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <GameBoard onGoHome={() => router.push('/')} />
  );
}

// Simple card value helper for bot AI
function getSimpleCardValue(card: { rank: string; suit: string }): number {
  if (card.rank === 'K' && card.suit === 'spades') return 0;
  if (card.rank === 'K') return 13;
  if (card.rank === 'A') return 1;
  if (card.rank === 'J') return 11;
  if (card.rank === 'Q') return 12;
  return parseInt(card.rank) || 10;
}

export default function GamePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);

  return (
    <GameProvider>
      <GameInitializer code={code} />
    </GameProvider>
  );
}
