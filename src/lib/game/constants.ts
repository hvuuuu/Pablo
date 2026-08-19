// ============================================================================
// Pablo Card Game — Constants & Configuration
// ============================================================================

import { Rank, Suit } from './types';

// Card point values
export const CARD_POINTS: Record<Rank, number> = {
  'A': 1,
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  '10': 10,
  'J': 11,
  'Q': 12,
  'K': 13, // Default for non-spade kings
};

// King of Spades is worth 0 points (best card)
export const KING_OF_SPADES_POINTS = 0;

// Special action cards (only when drawn from draw pile AND discarded)
export const SPECIAL_CARDS: Record<string, string> = {
  '7': 'peek_own',       // Peek at 1 of your own face-down cards
  '8': 'peek_opponent',  // Peek at 1 of an opponent's face-down cards
  '9': 'blind_swap',     // Swap 1 of your cards with 1 of an opponent's cards (blind)
};

// All suits
export const SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];

// All ranks
export const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

// Suit symbols for display
export const SUIT_SYMBOLS: Record<Suit, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
};

// Suit colors for display
export const SUIT_COLORS: Record<Suit, string> = {
  spades: 'text-slate-200',
  hearts: 'text-red-500',
  diamonds: 'text-red-500',
  clubs: 'text-slate-200',
};

// Game configuration
export const GAME_CONFIG = {
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 6,
  CARDS_PER_PLAYER: 4,
  PREVIEW_DURATION: 15,        // seconds (longer for comfortable memorization)
  PREVIEW_PEEKS_ALLOWED: 2,     // cards to peek during preview
  TURN_TIME_LIMIT: 45,          // seconds per turn
  SPECIAL_PEEK_DURATION: 7000,  // ms to show peeked card (7 seconds)
  ROOM_CODE_LENGTH: 6,
};

// Player colors for avatar backgrounds
export const PLAYER_COLORS = [
  '#10B981', // emerald
  '#3B82F6', // blue
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // violet
  '#EC4899', // pink
];

// Player emojis
export const PLAYER_EMOJIS = [
  '😎', '🦊', '🐱', '🦁', '🐸', '🐼',
  '🦄', '🐲', '🦅', '🐺', '🦋', '🎃',
];
