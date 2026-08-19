// ============================================================================
// Pablo Card Game — Core Type Definitions
// ============================================================================

export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
  faceUp: boolean;
}

export type GamePhase =
  | 'lobby'
  | 'preview'
  | 'playing'
  | 'final_round'
  | 'reveal'
  | 'game_over';

export type TurnStep =
  | 'waiting'        // Not this player's turn
  | 'draw_or_pablo'  // Player must draw (or call Pablo before drawing)
  | 'drawn_from_pile' // Player drew from draw pile, must swap or discard
  | 'drawn_from_discard' // Player drew from discard pile, must swap
  | 'special_ability' // Executing a special ability (7, 8, 9)
  | 'turn_complete';  // Turn is done

export type SpecialAbility = 'peek_own' | 'peek_opponent' | 'blind_swap' | null;

export interface Player {
  id: string;
  name: string;
  color: string;
  emoji: string;
  cards: Card[];           // Always 4 cards in 2x2 grid [0,1,2,3]
  isHost: boolean;
  isReady: boolean;
  isConnected: boolean;
  isWaiting?: boolean;     // Joined mid-game, waiting for the next round
  peekedCardIndices: number[];  // Cards the player has seen (memory aid — client only)
  score?: number;          // Calculated at game end
}

export interface GameState {
  roomCode: string;
  phase: GamePhase;
  players: Player[];
  currentPlayerIndex: number;
  turnStep: TurnStep;
  
  // Deck state
  drawPile: Card[];
  discardPile: Card[];
  
  // Current turn state
  drawnCard: Card | null;
  specialAbility: SpecialAbility;
  
  // Pablo call
  pabloCallerIndex: number | null;
  finalRoundTurnsLeft: number;
  
  // Preview phase
  previewTimeLeft: number;
  previewPeeksUsed: Record<string, number>; // playerId -> count
  
  // Turn timer
  turnTimeLimit: number;   // seconds
  turnStartedAt: number;   // timestamp
  
  // Action log & recent exchange tracking
  actionLog: ActionLogEntry[];
  lastActionInfo?: LastActionInfo | null;
  
  // Round tracking & Rematch
  roundNumber: number;
  winnerId: string | null;
  rematchVotes?: string[]; // Player IDs who are ready / voted for next round
}

export interface LastActionInfo {
  playerId: string;
  playerName: string;
  actionType: 'DRAW_FROM_PILE' | 'DRAW_FROM_DISCARD' | 'SWAP_WITH_GRID' | 'DISCARD_DRAWN' | 'CALL_PABLO' | 'SPECIAL';
  source?: 'draw_pile' | 'discard_pile';
  cardIndex?: number;
  cardIndices?: number[];
  slotName?: string;
  drawnCardRank?: string;
  drawnCardSuit?: string;
  discardedCardRank?: string;
  discardedCardSuit?: string;
  timestamp: number;
}

export interface ActionLogEntry {
  id: string;
  timestamp: number;
  playerId: string;
  playerName: string;
  action: string;
  detail?: string;
}

export interface Room {
  code: string;
  players: Player[];
  hostId: string;
  gameState: GameState | null;
  createdAt: number;
  maxPlayers: number;
}

// API action types
export type GameActionType =
  | 'START_GAME'
  | 'PREVIEW_PEEK'
  | 'END_PREVIEW'
  | 'DRAW_FROM_PILE'
  | 'DRAW_FROM_DISCARD'
  | 'SWAP_WITH_GRID'
  | 'DISCARD_DRAWN'
  | 'EXECUTE_PEEK_OWN'
  | 'EXECUTE_PEEK_OPPONENT'
  | 'EXECUTE_BLIND_SWAP'
  | 'CALL_PABLO'
  | 'SKIP_SPECIAL'
  | 'SKIP_TURN'
  | 'REMATCH_READY'
  | 'START_NEW_ROUND';

export interface GameAction {
  type: GameActionType;
  playerId: string;
  roomCode: string;
  payload?: {
    cardIndex?: number;        // Index in player's grid
    cardIndices?: number[];    // Multiple indices in player's grid for multi-card matching discard
    targetPlayerId?: string;   // For opponent actions
    targetCardIndex?: number;  // Index in opponent's grid
    revealOnly?: boolean;      // Private card-8 reveal request
  };
}

// Real-time event types (for Pusher/Upstash integration)
export type GameEventType =
  | 'PLAYER_JOINED'
  | 'PLAYER_LEFT'
  | 'PLAYER_READY'
  | 'GAME_STARTED'
  | 'PREVIEW_STARTED'
  | 'CARD_PEEKED'
  | 'TURN_STARTED'
  | 'CARD_DRAWN'
  | 'CARD_SWAPPED'
  | 'CARD_DISCARDED'
  | 'SPECIAL_TRIGGERED'
  | 'SPECIAL_EXECUTED'
  | 'PABLO_CALLED'
  | 'GAME_OVER'
  | 'STATE_SYNC';

export interface GameEvent {
  type: GameEventType;
  roomCode: string;
  playerId?: string;
  data?: Record<string, unknown>;
  timestamp: number;
}
