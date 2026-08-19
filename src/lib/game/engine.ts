// ============================================================================
// Pablo Card Game — Game Engine (State Machine)
// ============================================================================

import { GameState, Player, TurnStep, SpecialAbility, ActionLogEntry } from './types';
import { createDeck, shuffleDeck, dealCards, drawCard } from './deck';
import { calculatePlayerScore } from './scoring';
import { GAME_CONFIG, SPECIAL_CARDS } from './constants';
import { nanoid } from 'nanoid';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getSlotName(index: number): string {
  switch (index) {
    case 0: return 'Top-Left (#1)';
    case 1: return 'Top-Right (#2)';
    case 2: return 'Bottom-Left (#3)';
    case 3: return 'Bottom-Right (#4)';
    default: return `Slot #${index + 1}`;
  }
}

function addLog(state: GameState, playerId: string, playerName: string, action: string, detail?: string): ActionLogEntry {
  const entry: ActionLogEntry = {
    id: nanoid(8),
    timestamp: Date.now(),
    playerId,
    playerName,
    action,
    detail,
  };
  state.actionLog.push(entry);
  return entry;
}

// ---------------------------------------------------------------------------
// Game Initialization
// ---------------------------------------------------------------------------

/**
 * Create a new game state from a list of players
 */
export function createGame(players: Player[], roomCode: string, roundNumber: number = 1): GameState {
  const deck = shuffleDeck(createDeck());
  let remaining = deck;

  // Deal 4 cards to all participating players (including any who were waiting)
  const dealtPlayers = players.map(player => {
    const [hand, rest] = dealCards(remaining, GAME_CONFIG.CARDS_PER_PLAYER);
    remaining = rest;
    return {
      ...player,
      cards: hand,
      isWaiting: false,
      isReady: true,
      peekedCardIndices: [],
      score: undefined,
    };
  });

  const state: GameState = {
    roomCode,
    phase: 'preview',
    players: dealtPlayers,
    currentPlayerIndex: 0,
    turnStep: 'waiting',
    drawPile: remaining,
    discardPile: [],
    drawnCard: null,
    specialAbility: null,
    pabloCallerIndex: null,
    finalRoundTurnsLeft: 0,
    previewTimeLeft: GAME_CONFIG.PREVIEW_DURATION,
    previewPeeksUsed: {},
    turnTimeLimit: GAME_CONFIG.TURN_TIME_LIMIT,
    turnStartedAt: Date.now(),
    actionLog: [],
    lastActionInfo: null,
    roundNumber,
    winnerId: null,
    rematchVotes: [],
  };

  addLog(state, 'system', 'System', `Round ${roundNumber} started`, `${players.length} players`);
  return state;
}

/**
 * Handle a player marking themselves ready for a rematch
 */
export function rematchReady(state: GameState, playerId: string): GameState {
  const currentVotes = state.rematchVotes || [];
  if (currentVotes.includes(playerId)) return state;

  const newVotes = [...currentVotes, playerId];
  const player = state.players.find(p => p.id === playerId);
  if (player) {
    addLog(state, playerId, player.name, 'Ready for Next Game', 'Voted for rematch');
  }

  const newState: GameState = {
    ...state,
    rematchVotes: newVotes,
  };

  // If all players (at least 2) have voted, automatically launch the next round!
  if (newVotes.length >= state.players.length && state.players.length >= 2) {
    return createGame(state.players, state.roomCode, (state.roundNumber || 1) + 1);
  }

  return newState;
}

/**
 * Host manually launches next round with all currently ready players
 */
export function startNewRound(state: GameState, hostPlayerId: string, allRoomPlayers?: Player[]): GameState {
  const host = state.players.find(p => p.id === hostPlayerId);
  if (!host?.isHost) {
    throw new Error('Only the room host can start the next round');
  }

  const playersToDeal = allRoomPlayers || state.players;
  if (playersToDeal.length < 2) {
    throw new Error('Need at least 2 players to start a new round');
  }

  return createGame(playersToDeal, state.roomCode, (state.roundNumber || 1) + 1);
}

// ---------------------------------------------------------------------------
// Preview Phase
// ---------------------------------------------------------------------------

/**
 * Player peeks at one of their own cards during preview (strictly max 2 cards)
 */
export function previewPeek(state: GameState, playerId: string, cardIndex: number): GameState {
  if (state.phase !== 'preview') throw new Error('Not in preview phase');
  if (cardIndex < 0 || cardIndex > 3) throw new Error('Invalid card index');

  const peeksUsed = state.previewPeeksUsed[playerId] || 0;
  if (peeksUsed >= GAME_CONFIG.PREVIEW_PEEKS_ALLOWED) {
    throw new Error('Already used all preview peeks (max 2)');
  }

  const playerIndex = state.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1) throw new Error('Player not found');

  const player = state.players[playerIndex];
  if (player.peekedCardIndices.includes(cardIndex)) {
    throw new Error('Already peeked at this card');
  }

  const newState = { ...state };
  newState.players = [...state.players];
  newState.players[playerIndex] = {
    ...player,
    peekedCardIndices: [...player.peekedCardIndices, cardIndex],
  };
  newState.previewPeeksUsed = {
    ...state.previewPeeksUsed,
    [playerId]: peeksUsed + 1,
  };

  return newState;
}

/**
 * End preview phase and start playing — all cards flip back face down!
 */
export function endPreview(state: GameState): GameState {
  return {
    ...state,
    phase: 'playing',
    turnStep: 'draw_or_pablo',
    currentPlayerIndex: 0,
    turnStartedAt: Date.now(),
    previewTimeLeft: 0,
    players: state.players.map(p => ({
      ...p,
      peekedCardIndices: [], // Strictly hide all peeked cards when game begins!
    })),
  };
}

// ---------------------------------------------------------------------------
// Main Turn Actions
// ---------------------------------------------------------------------------

/**
 * Draw a card from the draw pile
 */
export function drawFromPile(state: GameState, playerId: string): GameState {
  validateTurn(state, playerId, 'draw_or_pablo');

  const [card, remaining] = drawCard(state.drawPile);
  if (!card) throw new Error('Draw pile is empty');

  const player = getCurrentPlayer(state);
  addLog(state, playerId, player.name, 'Drew from pile');

  return {
    ...state,
    drawPile: remaining,
    drawnCard: { ...card, faceUp: true },
    turnStep: 'drawn_from_pile',
    lastActionInfo: {
      playerId,
      playerName: player.name,
      actionType: 'DRAW_FROM_PILE',
      source: 'draw_pile',
      timestamp: Date.now(),
    },
  };
}

/**
 * Draw the top card from the discard pile
 */
export function drawFromDiscard(state: GameState, playerId: string): GameState {
  validateTurn(state, playerId, 'draw_or_pablo');

  if (state.discardPile.length === 0) throw new Error('Discard pile is empty');

  const [card, remaining] = drawCard(state.discardPile);
  if (!card) throw new Error('Discard pile is empty');

  const player = getCurrentPlayer(state);
  addLog(state, playerId, player.name, 'Drew from discard', `${card.rank}${getSuitSymbol(card.suit)}`);

  return {
    ...state,
    discardPile: remaining,
    drawnCard: { ...card, faceUp: true },
    turnStep: 'drawn_from_discard',
    lastActionInfo: {
      playerId,
      playerName: player.name,
      actionType: 'DRAW_FROM_DISCARD',
      source: 'discard_pile',
      drawnCardRank: card.rank,
      drawnCardSuit: card.suit,
      timestamp: Date.now(),
    },
  };
}

/**
 * Swap or Match-Discard with player's grid cards.
 * Accepts a single card index or an array of card indices for multi-card matching discard.
 * - 1 card: standard swap (drawnCard takes slot, old card placed face-up in discard).
 * - 2+ cards:
 *   - If all selected cards match in rank (e.g., two Jacks): All matching cards discarded,
 *     drawnCard replaces first slot, remaining matched slots eliminated (hand reduced!).
 *   - If cards mismatch: Penalty! Keeps all cards and drawnCard is added as an extra card.
 */
export function swapWithGrid(
  state: GameState,
  playerId: string,
  target: number | number[]
): GameState {
  if (state.turnStep !== 'drawn_from_pile' && state.turnStep !== 'drawn_from_discard') {
    throw new Error('Must draw a card first');
  }
  validateCurrentPlayer(state, playerId);
  if (!state.drawnCard) throw new Error('No drawn card');

  const sourcePile = state.turnStep === 'drawn_from_discard' ? 'discard_pile' : 'draw_pile';
  const indices = Array.isArray(target) ? target : [target];
  if (indices.length === 0) throw new Error('No cards selected');

  const playerIndex = state.currentPlayerIndex;
  const player = state.players[playerIndex];

  // Validate all indices
  for (const idx of indices) {
    if (idx < 0 || idx >= player.cards.length) {
      throw new Error(`Invalid card index: ${idx}`);
    }
  }

  // --- Path 1: Single Card Swap ---
  if (indices.length === 1) {
    const cardIndex = indices[0];
    const oldCard = player.cards[cardIndex];
    const slotName = getSlotName(cardIndex);

    const newCards = [...player.cards];
    newCards[cardIndex] = { ...state.drawnCard, faceUp: false };

    const newPlayers = [...state.players];
    newPlayers[playerIndex] = {
      ...player,
      cards: newCards,
      peekedCardIndices: player.peekedCardIndices.filter(i => i !== cardIndex),
    };

    addLog(state, playerId, player.name, 'Swapped card', `${slotName} (Discarded ${oldCard.rank}${getSuitSymbol(oldCard.suit)})`);

    const newState: GameState = {
      ...state,
      players: newPlayers,
      discardPile: [{ ...oldCard, faceUp: true }, ...state.discardPile],
      drawnCard: null,
      turnStep: 'turn_complete',
      lastActionInfo: {
        playerId,
        playerName: player.name,
        actionType: 'SWAP_WITH_GRID',
        source: sourcePile,
        cardIndex,
        slotName,
        drawnCardRank: state.drawnCard.rank,
        drawnCardSuit: state.drawnCard.suit,
        discardedCardRank: oldCard.rank,
        discardedCardSuit: oldCard.suit,
        timestamp: Date.now(),
      },
    };

    return advanceTurn(newState);
  }

  // --- Path 2: Multi-Card Match Attempt (2+ cards) ---
  const selectedCards = indices.map(idx => player.cards[idx]);
  const firstRank = selectedCards[0].rank;
  const allMatch = selectedCards.every(c => c.rank === firstRank);

  if (allMatch) {
    // SUCCESS: Discard all matching cards, replace first slot with drawnCard, eliminate remaining
    const drawn = { ...state.drawnCard, faceUp: false };
    const indicesSet = new Set(indices);
    const firstIndex = indices[0];

    const newCards: typeof player.cards = [];
    for (let i = 0; i < player.cards.length; i++) {
      if (i === firstIndex) {
        newCards.push(drawn);
      } else if (!indicesSet.has(i)) {
        newCards.push(player.cards[i]);
      }
    }

    const discardedMatchingCards = selectedCards.map(c => ({ ...c, faceUp: true }));

    const newPlayers = [...state.players];
    newPlayers[playerIndex] = {
      ...player,
      cards: newCards,
      peekedCardIndices: [], // Clear peek tracking as layout shifted
    };

    addLog(
      state,
      playerId,
      player.name,
      '🎉 MATCH DISCARD!',
      `Matched ${selectedCards.length}x ${firstRank}s! Discarded both and reduced hand to ${newCards.length} cards.`
    );

    const newState: GameState = {
      ...state,
      players: newPlayers,
      discardPile: [...discardedMatchingCards, ...state.discardPile],
      drawnCard: null,
      turnStep: 'turn_complete',
    };

    return advanceTurn(newState);
  } else {
    // MISMATCH PENALTY: Player keeps existing cards + drawn card added as penalty!
    const drawn = { ...state.drawnCard, faceUp: false };
    const newCards = [...player.cards, drawn];

    const ranksList = selectedCards.map(c => `${c.rank}${getSuitSymbol(c.suit)}`).join(' & ');

    const newPlayers = [...state.players];
    newPlayers[playerIndex] = {
      ...player,
      cards: newCards,
    };

    addLog(
      state,
      playerId,
      player.name,
      '⚠️ MISMATCH PENALTY!',
      `Selected cards (${ranksList}) did not match! Drawn card added as penalty (+1 card)!`
    );

    const newState: GameState = {
      ...state,
      players: newPlayers,
      drawnCard: null,
      turnStep: 'turn_complete',
    };

    return advanceTurn(newState);
  }
}

/**
 * Discard the drawn card (only for cards drawn from the draw pile)
 */
export function discardDrawn(state: GameState, playerId: string): GameState {
  if (state.turnStep !== 'drawn_from_pile') {
    throw new Error('Can only discard cards drawn from the draw pile');
  }
  validateCurrentPlayer(state, playerId);
  if (!state.drawnCard) throw new Error('No drawn card');

  const player = getCurrentPlayer(state);
  const card = state.drawnCard;

  addLog(state, playerId, player.name, 'Discarded', `${card.rank}${getSuitSymbol(card.suit)}`);

  const newState: GameState = {
    ...state,
    discardPile: [{ ...card, faceUp: true }, ...state.discardPile],
    drawnCard: null,
  };

  // Check for special ability
  const specialKey = card.rank;
  if (SPECIAL_CARDS[specialKey]) {
    const ability = SPECIAL_CARDS[specialKey] as SpecialAbility;
    addLog(newState, playerId, player.name, 'Special ability!', `Card ${card.rank} → ${getAbilityName(ability)}`);
    return {
      ...newState,
      specialAbility: ability,
      turnStep: 'special_ability',
    };
  }

  return advanceTurn({ ...newState, turnStep: 'turn_complete' });
}

// ---------------------------------------------------------------------------
// Special Abilities
// ---------------------------------------------------------------------------

/**
 * Execute peek at own card (ability from card 7)
 */
export function executePeekOwn(state: GameState, playerId: string, cardIndex: number): GameState {
  validateCurrentPlayer(state, playerId);
  if (state.specialAbility !== 'peek_own') throw new Error('Not executing peek own ability');
  if (cardIndex < 0 || cardIndex > 3) throw new Error('Invalid card index');

  const player = getCurrentPlayer(state);
  addLog(state, playerId, player.name, 'Peeked own card', `Position ${cardIndex + 1}`);

  const newState: GameState = {
    ...state,
    specialAbility: null,
    turnStep: 'turn_complete',
  };

  return advanceTurn(newState);
}

/**
 * Execute peek at opponent's card (ability from card 8)
 */
export function executePeekOpponent(
  state: GameState,
  playerId: string,
  targetPlayerId: string,
  targetCardIndex: number
): GameState {
  validateCurrentPlayer(state, playerId);
  if (state.specialAbility !== 'peek_opponent') throw new Error('Not executing peek opponent ability');
  if (targetPlayerId === playerId) throw new Error('Cannot peek at your own cards with this ability');
  if (targetCardIndex < 0 || targetCardIndex > 3) throw new Error('Invalid card index');

  const targetPlayerIndex = state.players.findIndex(p => p.id === targetPlayerId);
  if (targetPlayerIndex === -1) throw new Error('Target player not found');

  const player = getCurrentPlayer(state);
  const targetPlayer = state.players[targetPlayerIndex];

  addLog(state, playerId, player.name, 'Peeked opponent card', `${targetPlayer.name}'s position ${targetCardIndex + 1}`);

  const newState: GameState = {
    ...state,
    specialAbility: null,
    turnStep: 'turn_complete',
  };

  return advanceTurn(newState);
}

/**
 * Execute blind swap (ability from card 9)
 */
export function executeBlindSwap(
  state: GameState,
  playerId: string,
  ownCardIndex: number,
  targetPlayerId: string,
  targetCardIndex: number
): GameState {
  validateCurrentPlayer(state, playerId);
  if (state.specialAbility !== 'blind_swap') throw new Error('Not executing blind swap ability');
  if (targetPlayerId === playerId) throw new Error('Cannot swap with yourself');
  if (ownCardIndex < 0 || ownCardIndex > 3) throw new Error('Invalid own card index');
  if (targetCardIndex < 0 || targetCardIndex > 3) throw new Error('Invalid target card index');

  const playerIndex = state.currentPlayerIndex;
  const targetPlayerIndex = state.players.findIndex(p => p.id === targetPlayerId);
  if (targetPlayerIndex === -1) throw new Error('Target player not found');

  const player = state.players[playerIndex];
  const targetPlayer = state.players[targetPlayerIndex];

  // Swap the cards
  const newPlayerCards = [...player.cards];
  const newTargetCards = [...targetPlayer.cards];
  const temp = newPlayerCards[ownCardIndex];
  newPlayerCards[ownCardIndex] = newTargetCards[targetCardIndex];
  newTargetCards[targetCardIndex] = temp;

  const newPlayers = [...state.players];
  newPlayers[playerIndex] = {
    ...player,
    cards: newPlayerCards,
    peekedCardIndices: player.peekedCardIndices.filter(i => i !== ownCardIndex),
  };
  newPlayers[targetPlayerIndex] = {
    ...targetPlayer,
    cards: newTargetCards,
    peekedCardIndices: targetPlayer.peekedCardIndices.filter(i => i !== targetCardIndex),
  };

  addLog(state, playerId, player.name, 'Blind swapped', `with ${targetPlayer.name}`);

  const newState: GameState = {
    ...state,
    players: newPlayers,
    specialAbility: null,
    turnStep: 'turn_complete',
  };

  return advanceTurn(newState);
}

/**
 * Skip a special ability
 */
export function skipSpecial(state: GameState, playerId: string): GameState {
  validateCurrentPlayer(state, playerId);
  if (state.turnStep !== 'special_ability') throw new Error('No special ability to skip');

  const player = getCurrentPlayer(state);
  addLog(state, playerId, player.name, 'Skipped special ability');

  const newState: GameState = {
    ...state,
    specialAbility: null,
    turnStep: 'turn_complete',
  };

  return advanceTurn(newState);
}

// ---------------------------------------------------------------------------
// Pablo Call & Game End
// ---------------------------------------------------------------------------

/**
 * Call Pablo — player believes they have the lowest total.
 * Can be called either on the player's own turn or on another player's turn.
 * The game enters the final round and finishes right when the last player before the caller completes their turn.
 */
export function callPablo(state: GameState, playerId: string): GameState {
  if (state.phase !== 'playing') {
    throw new Error('Can only call Pablo during the playing phase');
  }
  if (state.pabloCallerIndex !== null) {
    throw new Error('Pablo already called');
  }

  const callerIndex = state.players.findIndex(p => p.id === playerId);
  if (callerIndex === -1) {
    throw new Error('Player not found');
  }

  const currentActiveIndex = state.currentPlayerIndex;
  const isCallerTurn = callerIndex === currentActiveIndex;

  // Calculate remaining turns before the caller's turn would come around again:
  // - If caller called on their own turn: all other (N - 1) players get 1 turn.
  // - If caller called during someone else's turn: current active player finishes turn + subsequent players up to caller.
  const otherPlayerCount = isCallerTurn
    ? state.players.length - 1
    : (callerIndex - currentActiveIndex + state.players.length) % state.players.length;

  if (state.drawPile.length < otherPlayerCount) {
    throw new Error(
      `Cannot call Pablo: Need at least ${otherPlayerCount} card${otherPlayerCount !== 1 ? 's' : ''} in the draw pile for all other players' turns before your turn (${state.drawPile.length} left)`
    );
  }

  const caller = state.players[callerIndex];
  addLog(state, playerId, caller.name, '🎉 PABLO!', 'Claims lowest score!');

  return {
    ...state,
    phase: 'final_round',
    pabloCallerIndex: callerIndex,
    finalRoundTurnsLeft: otherPlayerCount,
    currentPlayerIndex: isCallerTurn
      ? (callerIndex + 1) % state.players.length
      : currentActiveIndex,
    turnStep: isCallerTurn
      ? 'draw_or_pablo'
      : state.turnStep,
    turnStartedAt: isCallerTurn
      ? Date.now()
      : state.turnStartedAt,
  };
}

/**
 * Reveal all cards and calculate final scores
 */
export function revealAll(state: GameState): GameState {
  const scoredPlayers = state.players.map(p => ({
    ...p,
    score: calculatePlayerScore(p.cards),
    cards: p.cards.map(c => ({ ...c, faceUp: true })),
  }));

  // Sort by score ascending to find winner
  const sorted = [...scoredPlayers].sort((a, b) => (a.score ?? 0) - (b.score ?? 0));
  const winnerId = sorted[0]?.id || null;

  // Check if Pablo caller won (has lowest or tied for lowest)
  const pabloCaller = state.pabloCallerIndex !== null ? state.players[state.pabloCallerIndex] : null;
  if (pabloCaller) {
    const callerScore = scoredPlayers.find(p => p.id === pabloCaller.id)?.score ?? Infinity;
    const lowestScore = sorted[0]?.score ?? Infinity;
    if (callerScore > lowestScore) {
      addLog(state, pabloCaller.id, pabloCaller.name, 'Pablo failed!', `Score: ${callerScore} (not lowest)`);
    } else {
      addLog(state, pabloCaller.id, pabloCaller.name, 'Pablo succeeded!', `Score: ${callerScore}`);
    }
  }

  addLog(state, 'system', 'System', 'Game over', `Winner: ${sorted[0]?.name}`);

  return {
    ...state,
    phase: 'game_over',
    players: scoredPlayers,
    winnerId,
    turnStep: 'waiting',
  };
}

// ---------------------------------------------------------------------------
// Turn Management
// ---------------------------------------------------------------------------

/**
 * Advance to the next player's turn
 */
function advanceTurn(state: GameState): GameState {
  const nextIndex = (state.currentPlayerIndex + 1) % state.players.length;

  // Check if final round is over
  if (state.phase === 'final_round') {
    const turnsLeft = state.finalRoundTurnsLeft - 1;
    if (turnsLeft <= 0) {
      // Final round complete — reveal all
      return revealAll({
        ...state,
        phase: 'reveal',
      });
    }

    // Skip the Pablo caller's turn in final round
    let adjustedNext = nextIndex;
    if (adjustedNext === state.pabloCallerIndex) {
      adjustedNext = (adjustedNext + 1) % state.players.length;
    }

    return {
      ...state,
      currentPlayerIndex: adjustedNext,
      turnStep: 'draw_or_pablo',
      finalRoundTurnsLeft: turnsLeft,
      turnStartedAt: Date.now(),
    };
  }

  return {
    ...state,
    currentPlayerIndex: nextIndex,
    turnStep: 'draw_or_pablo',
    turnStartedAt: Date.now(),
  };
}

/**
 * Skip a player's turn when time limit expires
 */
export function skipTurn(state: GameState, playerId?: string): GameState {
  if (state.phase !== 'playing' && state.phase !== 'final_round') {
    return state;
  }
  const player = state.players[state.currentPlayerIndex];
  if (playerId && player.id !== playerId) {
    return state;
  }

  addLog(state, player.id, player.name, '⏰ Time expired!', 'Turn skipped automatically');

  const nextState = { ...state };
  if (nextState.drawnCard) {
    nextState.discardPile = [nextState.drawnCard, ...nextState.discardPile];
    nextState.drawnCard = null;
    nextState.specialAbility = null;
  }

  return advanceTurn(nextState);
}

/**
 * Check and resolve timeouts for preview and turn phases
 */
export function checkTimeouts(state: GameState): GameState {
  const now = Date.now();
  if (state.phase === 'preview') {
    const elapsed = Math.floor((now - (state.turnStartedAt || now)) / 1000);
    if (elapsed >= GAME_CONFIG.PREVIEW_DURATION) {
      return endPreview(state);
    }
    return {
      ...state,
      previewTimeLeft: Math.max(0, GAME_CONFIG.PREVIEW_DURATION - elapsed),
    };
  }

  if (state.phase === 'playing' || state.phase === 'final_round') {
    const elapsed = Math.floor((now - (state.turnStartedAt || now)) / 1000);
    if (elapsed >= state.turnTimeLimit) {
      return skipTurn(state);
    }
  }

  return state;
}

// ---------------------------------------------------------------------------
// Validation Helpers
// ---------------------------------------------------------------------------

function validateCurrentPlayer(state: GameState, playerId: string): void {
  const currentPlayer = state.players[state.currentPlayerIndex];
  if (currentPlayer.id !== playerId) {
    throw new Error('Not your turn');
  }
}

function validateTurn(state: GameState, playerId: string, expectedStep: TurnStep): void {
  validateCurrentPlayer(state, playerId);
  if (state.turnStep !== expectedStep) {
    throw new Error(`Invalid turn step. Expected: ${expectedStep}, Got: ${state.turnStep}`);
  }
}

function getCurrentPlayer(state: GameState): Player {
  return state.players[state.currentPlayerIndex];
}

function getSuitSymbol(suit: string): string {
  const symbols: Record<string, string> = {
    spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣',
  };
  return symbols[suit] || suit;
}

function getAbilityName(ability: SpecialAbility): string {
  switch (ability) {
    case 'peek_own': return 'Peek at your own card';
    case 'peek_opponent': return "Peek at opponent's card";
    case 'blind_swap': return 'Blind swap';
    default: return 'None';
  }
}
