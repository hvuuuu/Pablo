// ============================================================================
// Pablo Card Game — Deck Utilities
// ============================================================================

import { Card, Suit, Rank } from './types';
import { SUITS, RANKS } from './constants';

/**
 * Generate a unique card ID from suit and rank
 */
function cardId(suit: Suit, rank: Rank): string {
  return `${rank}_${suit}`;
}

/**
 * Create a standard 52-card deck
 */
export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        id: cardId(suit, rank),
        suit,
        rank,
        faceUp: false,
      });
    }
  }
  return deck;
}

/**
 * Fisher-Yates shuffle algorithm — fair, unbiased shuffle
 */
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Deal cards from the top of the deck
 * Returns [dealtCards, remainingDeck]
 */
export function dealCards(deck: Card[], count: number): [Card[], Card[]] {
  const dealt = deck.slice(0, count).map(card => ({ ...card, faceUp: false }));
  const remaining = deck.slice(count);
  return [dealt, remaining];
}

/**
 * Draw a single card from the top of a pile
 * Returns [drawnCard, remainingPile] or [null, pile] if empty
 */
export function drawCard(pile: Card[]): [Card | null, Card[]] {
  if (pile.length === 0) return [null, pile];
  const card = { ...pile[0] };
  return [card, pile.slice(1)];
}
