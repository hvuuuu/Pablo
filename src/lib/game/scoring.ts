// ============================================================================
// Pablo Card Game — Scoring System
// ============================================================================

import { Card, Player } from './types';
import { CARD_POINTS, KING_OF_SPADES_POINTS } from './constants';

/**
 * Get the point value of a single card
 * King of Spades (K♠) = 0 points (best card)
 * Other Kings (K♣, K♦, K♥) = 13 points (penalty)
 * Ace = 1, 2-10 = face value, J = 11, Q = 12
 */
export function getCardPoints(card: Card): number {
  if (card.rank === 'K' && card.suit === 'spades') {
    return KING_OF_SPADES_POINTS;
  }
  return CARD_POINTS[card.rank];
}

/**
 * Calculate total score for a player's hand (4 cards)
 */
export function calculatePlayerScore(cards: Card[]): number {
  return cards.reduce((total, card) => total + getCardPoints(card), 0);
}

/**
 * Determine the winner(s) — player(s) with the lowest score
 * Returns array in case of tie
 */
export function determineWinner(players: Player[]): Player[] {
  const scored = players.map(p => ({
    ...p,
    score: calculatePlayerScore(p.cards),
  }));

  const minScore = Math.min(...scored.map(p => p.score!));
  return scored.filter(p => p.score === minScore);
}

/**
 * Rank all players by score (ascending — lowest is best)
 */
export function rankPlayers(players: Player[]): Player[] {
  return [...players]
    .map(p => ({ ...p, score: calculatePlayerScore(p.cards) }))
    .sort((a, b) => (a.score ?? 0) - (b.score ?? 0));
}

/**
 * Get a human-readable description of a card's point value
 */
export function getCardPointDescription(card: Card): string {
  const points = getCardPoints(card);
  if (card.rank === 'K' && card.suit === 'spades') {
    return '0 pts (King of Spades — Best!)';
  }
  if (card.rank === 'K') {
    return '13 pts (King — Penalty!)';
  }
  return `${points} pt${points !== 1 ? 's' : ''}`;
}
