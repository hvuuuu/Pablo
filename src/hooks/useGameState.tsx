'use client';
// ============================================================================
// Pablo Card Game — Game State Hook (Context + Reducer)
// ============================================================================

import { createContext, useContext, useReducer, useCallback, ReactNode, useEffect } from 'react';
import {
  GameState,
  GamePhase,
  Player,
  Card,
  TurnStep,
  SpecialAbility,
  ActionLogEntry,
  GameActionType,
} from '@/lib/game/types';
import * as engine from '@/lib/game/engine';

// ---------------------------------------------------------------------------
// State Shape
// ---------------------------------------------------------------------------

interface GameStore {
  // Room info
  roomCode: string | null;
  playerId: string | null;
  
  // Game state (local for demo, API-synced for multiplayer)
  gameState: GameState | null;
  
  // UI state
  selectedCardIndex: number | null;
  selectedOpponentId: string | null;
  selectedOpponentCardIndex: number | null;
  peekedCard: { card: Card; playerName: string; position: number } | null;
  isLoading: boolean;
  error: string | null;
}

const initialStore: GameStore = {
  roomCode: null,
  playerId: null,
  gameState: null,
  selectedCardIndex: null,
  selectedOpponentId: null,
  selectedOpponentCardIndex: null,
  peekedCard: null,
  isLoading: false,
  error: null,
};

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

type GameStoreAction =
  | { type: 'SET_ROOM'; roomCode: string; playerId: string }
  | { type: 'SET_GAME_STATE'; gameState: GameState }
  | { type: 'TICK_PREVIEW_TIMER' }
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'SELECT_CARD'; index: number | null }
  | { type: 'SELECT_OPPONENT'; id: string | null }
  | { type: 'SELECT_OPPONENT_CARD'; index: number | null }
  | { type: 'SET_PEEKED_CARD'; card: Card | null; playerName?: string; position?: number }
  | { type: 'CLEAR_SELECTIONS' }
  | { type: 'RESET' };

function gameStoreReducer(state: GameStore, action: GameStoreAction): GameStore {
  switch (action.type) {
    case 'SET_ROOM':
      return { ...state, roomCode: action.roomCode, playerId: action.playerId };
    case 'SET_GAME_STATE':
      return { ...state, gameState: action.gameState, error: null };
    case 'TICK_PREVIEW_TIMER':
      if (!state.gameState || state.gameState.phase !== 'preview') return state;
      return {
        ...state,
        gameState: {
          ...state.gameState,
          previewTimeLeft: Math.max(0, state.gameState.previewTimeLeft - 1),
        },
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.isLoading };
    case 'SET_ERROR':
      return { ...state, error: action.error, isLoading: false };
    case 'SELECT_CARD':
      return { ...state, selectedCardIndex: action.index };
    case 'SELECT_OPPONENT':
      return { ...state, selectedOpponentId: action.id, selectedOpponentCardIndex: null };
    case 'SELECT_OPPONENT_CARD':
      return { ...state, selectedOpponentCardIndex: action.index };
    case 'SET_PEEKED_CARD':
      return {
        ...state,
        peekedCard: action.card
          ? { card: action.card, playerName: action.playerName || '', position: action.position || 0 }
          : null,
      };
    case 'CLEAR_SELECTIONS':
      return {
        ...state,
        selectedCardIndex: null,
        selectedOpponentId: null,
        selectedOpponentCardIndex: null,
        peekedCard: null,
      };
    case 'RESET':
      return initialStore;
    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface GameContextValue {
  store: GameStore;
  dispatch: React.Dispatch<GameStoreAction>;

  // Convenience getters
  currentPlayer: Player | null;
  isMyTurn: boolean;
  myCards: Card[];
  opponents: Player[];
  phase: GamePhase | null;
  turnStep: TurnStep | null;
  specialAbility: SpecialAbility;
  drawnCard: Card | null;
  discardTop: Card | null;
  drawPileCount: number;
  actionLog: ActionLogEntry[];
  isPabloCalled: boolean;
  pabloCaller: Player | null;

  // Actions (local demo mode)
  sendAction: (type: GameActionType, payload?: Record<string, unknown>) => void;
  startLocalGame: (players: Player[]) => void;
  endPreviewPhase: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function GameProvider({ children }: { children: ReactNode }) {
  const [store, dispatch] = useReducer(gameStoreReducer, initialStore);

  // Derived state
  const gameState = store.gameState;
  const playerId = store.playerId;

  const currentPlayer = gameState
    ? gameState.players.find(p => p.id === playerId) || null
    : null;

  const isMyTurn = gameState
    ? gameState.players[gameState.currentPlayerIndex]?.id === playerId
    : false;

  const myCards = currentPlayer?.cards || [];

  const opponents = gameState
    ? gameState.players.filter(p => p.id !== playerId)
    : [];

  const phase = gameState?.phase || null;
  const turnStep = gameState?.turnStep || null;
  const specialAbility = gameState?.specialAbility || null;
  const drawnCard = gameState?.drawnCard || null;
  const discardTop = gameState?.discardPile[0] || null;
  const drawPileCount = gameState?.drawPile.length || 0;
  const actionLog = gameState?.actionLog || [];
  const isPabloCalled = gameState?.pabloCallerIndex !== null;
  const pabloCaller = gameState && gameState.pabloCallerIndex !== null
    ? gameState.players[gameState.pabloCallerIndex]
    : null;

  // Preview timer
  useEffect(() => {
    if (gameState?.phase !== 'preview') return;

    if (gameState.previewTimeLeft <= 0) {
      if (!store.roomCode || store.roomCode === 'DEMO' || store.roomCode === 'LOCAL') {
        const ended = engine.endPreview(gameState);
        dispatch({ type: 'SET_GAME_STATE', gameState: ended });
      }
      return;
    }

    const timer = setTimeout(() => {
      dispatch({ type: 'TICK_PREVIEW_TIMER' });
    }, 1000);

    return () => clearTimeout(timer);
  }, [gameState?.phase, gameState?.previewTimeLeft, store.roomCode, gameState]);

  // Process game actions (local engine for demo, API for multiplayer)
  const sendAction = useCallback(async (type: GameActionType, payload?: Record<string, unknown>) => {
    if (!gameState || !playerId) return;

    const isLocal = !store.roomCode || store.roomCode === 'DEMO' || store.roomCode === 'LOCAL';

    if (isLocal) {
      try {
        let newState: GameState;

        switch (type) {
          case 'PREVIEW_PEEK':
            newState = engine.previewPeek(gameState, playerId, Number(payload?.cardIndex ?? 0));
            break;
          case 'END_PREVIEW':
            newState = engine.endPreview(gameState);
            break;
          case 'DRAW_FROM_PILE':
            newState = engine.drawFromPile(gameState, playerId);
            break;
          case 'DRAW_FROM_DISCARD':
            newState = engine.drawFromDiscard(gameState, playerId);
            break;
          case 'SWAP_WITH_GRID': {
            const target = Array.isArray(payload?.cardIndices)
              ? (payload.cardIndices as number[])
              : Number(payload?.cardIndex ?? 0);
            newState = engine.swapWithGrid(gameState, playerId, target);
            break;
          }
          case 'DISCARD_DRAWN':
            newState = engine.discardDrawn(gameState, playerId);
            break;
          case 'EXECUTE_PEEK_OWN':
            newState = engine.executePeekOwn(gameState, playerId, Number(payload?.cardIndex ?? 0));
            break;
          case 'EXECUTE_PEEK_OPPONENT':
            newState = engine.executePeekOpponent(
              gameState,
              playerId,
              String(payload?.targetPlayerId ?? ''),
              Number(payload?.targetCardIndex ?? 0)
            );
            break;
          case 'EXECUTE_BLIND_SWAP':
            newState = engine.executeBlindSwap(
              gameState,
              playerId,
              Number(payload?.cardIndex ?? 0),
              String(payload?.targetPlayerId ?? ''),
              Number(payload?.targetCardIndex ?? 0)
            );
            break;
          case 'SKIP_SPECIAL':
            newState = engine.skipSpecial(gameState, playerId);
            break;
          case 'CALL_PABLO':
            newState = engine.callPablo(gameState, playerId);
            break;
          case 'SKIP_TURN':
            newState = engine.skipTurn(gameState, playerId);
            break;
          case 'REMATCH_READY':
          case 'START_NEW_ROUND':
            newState = engine.createGame(gameState.players, store.roomCode || 'LOCAL', (gameState.roundNumber || 1) + 1);
            break;
          default:
            console.warn('Unknown action type:', type);
            return;
        }

        dispatch({ type: 'SET_GAME_STATE', gameState: newState });
        dispatch({ type: 'CLEAR_SELECTIONS' });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Action failed';
        dispatch({ type: 'SET_ERROR', error: message });
        console.error('Game action error:', message);
      }
    } else {
      // Multiplayer mode: POST to API
      try {
        const res = await fetch('/api/game/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type,
            playerId,
            roomCode: store.roomCode,
            payload,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to process game action');
        if (data.gameState) {
          dispatch({ type: 'SET_GAME_STATE', gameState: data.gameState });
        }
        dispatch({ type: 'CLEAR_SELECTIONS' });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Action failed';
        dispatch({ type: 'SET_ERROR', error: message });
        console.error('Game action error:', message);
      }
    }
  }, [gameState, playerId, store.roomCode]);

  const startLocalGame = useCallback((players: Player[]) => {
    const newGameState = engine.createGame(players, store.roomCode || 'LOCAL');
    dispatch({ type: 'SET_GAME_STATE', gameState: newGameState });
  }, [store.roomCode]);

  const endPreviewPhase = useCallback(() => {
    sendAction('END_PREVIEW');
  }, [sendAction]);

  const value: GameContextValue = {
    store,
    dispatch,
    currentPlayer,
    isMyTurn,
    myCards,
    opponents,
    phase,
    turnStep,
    specialAbility,
    drawnCard,
    discardTop,
    drawPileCount,
    actionLog,
    isPabloCalled,
    pabloCaller,
    sendAction,
    startLocalGame,
    endPreviewPhase,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGameState() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameState must be used within a GameProvider');
  }
  return context;
}
