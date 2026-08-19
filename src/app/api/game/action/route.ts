// ============================================================================
// POST /api/game/action — Process game actions
// ============================================================================

import { broadcastEvent, createEvent } from "@/lib/events";
import {
  callPablo,
  createGame,
  discardDrawn,
  drawFromDiscard,
  drawFromPile,
  endPreview,
  executeBlindSwap,
  executePeekOpponent,
  executePeekOwn,
  previewPeek,
  rematchReady,
  skipSpecial,
  skipTurn,
  startNewRound,
  swapWithGrid,
} from "@/lib/game/engine";
import { getRoom, updateGameState } from "@/lib/game/room-manager";
import { GameAction, GameState } from "@/lib/game/types";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body: GameAction = await request.json();
    const { type, playerId, roomCode, payload } = body;

    if (!type || !playerId || !roomCode) {
      return NextResponse.json(
        { error: "Missing required fields: type, playerId, roomCode" },
        { status: 400 },
      );
    }

    const room = await getRoom(roomCode);
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    let gameState: GameState;

    switch (type) {
      case "START_GAME": {
        // Only host can start
        if (room.hostId !== playerId) {
          return NextResponse.json(
            { error: "Only the host can start the game" },
            { status: 403 },
          );
        }
        if (room.players.length < 2) {
          return NextResponse.json(
            { error: "Need at least 2 players" },
            { status: 400 },
          );
        }
        gameState = createGame(room.players, roomCode);
        break;
      }

      case "PREVIEW_PEEK": {
        if (!room.gameState) {
          return NextResponse.json(
            { error: "Game not started" },
            { status: 400 },
          );
        }
        gameState = previewPeek(
          room.gameState,
          playerId,
          payload?.cardIndex ?? -1,
        );
        break;
      }

      case "END_PREVIEW": {
        if (!room.gameState) {
          return NextResponse.json(
            { error: "Game not started" },
            { status: 400 },
          );
        }
        gameState = endPreview(room.gameState);
        break;
      }

      case "DRAW_FROM_PILE": {
        if (!room.gameState) {
          return NextResponse.json(
            { error: "Game not started" },
            { status: 400 },
          );
        }
        gameState = drawFromPile(room.gameState, playerId);
        break;
      }

      case "DRAW_FROM_DISCARD": {
        if (!room.gameState) {
          return NextResponse.json(
            { error: "Game not started" },
            { status: 400 },
          );
        }
        gameState = drawFromDiscard(room.gameState, playerId);
        break;
      }

      case "SWAP_WITH_GRID": {
        if (!room.gameState) {
          return NextResponse.json(
            { error: "Game not started" },
            { status: 400 },
          );
        }
        const targetIndices =
          payload?.cardIndices ??
          (payload?.cardIndex !== undefined ? [payload.cardIndex] : [0]);
        gameState = swapWithGrid(room.gameState, playerId, targetIndices);
        break;
      }

      case "DISCARD_DRAWN": {
        if (!room.gameState) {
          return NextResponse.json(
            { error: "Game not started" },
            { status: 400 },
          );
        }
        gameState = discardDrawn(room.gameState, playerId);
        break;
      }

      case "EXECUTE_PEEK_OWN": {
        if (!room.gameState) {
          return NextResponse.json(
            { error: "Game not started" },
            { status: 400 },
          );
        }
        gameState = executePeekOwn(
          room.gameState,
          playerId,
          payload?.cardIndex ?? -1,
        );
        break;
      }

      case "EXECUTE_PEEK_OPPONENT": {
        if (!room.gameState) {
          return NextResponse.json(
            { error: "Game not started" },
            { status: 400 },
          );
        }
        const targetPlayer = room.gameState.players.find(
          (player) => player.id === payload?.targetPlayerId,
        );
        const targetCardIndex = payload?.targetCardIndex ?? -1;
        const targetCard = targetPlayer?.cards[targetCardIndex];
        const currentPlayer =
          room.gameState.players[room.gameState.currentPlayerIndex];
        if (!targetPlayer || !targetCard || targetPlayer.id === playerId) {
          return NextResponse.json(
            { error: "Target card not found" },
            { status: 400 },
          );
        }
        if (payload?.revealOnly) {
          if (
            currentPlayer?.id !== playerId ||
            room.gameState.specialAbility !== "peek_opponent"
          ) {
            return NextResponse.json(
              { error: "Peek ability is not available" },
              { status: 403 },
            );
          }
          // This card is sent only to the player using the 8. It is not saved
          // to Redis and is never included in the Pusher room update.
          return NextResponse.json({
            success: true,
            privatePeek: { card: { ...targetCard, faceUp: true } },
          });
        }
        gameState = executePeekOpponent(
          room.gameState,
          playerId,
          payload?.targetPlayerId ?? "",
          targetCardIndex,
        );
        break;
      }
      case "EXECUTE_BLIND_SWAP": {
        if (!room.gameState) {
          return NextResponse.json(
            { error: "Game not started" },
            { status: 400 },
          );
        }
        gameState = executeBlindSwap(
          room.gameState,
          playerId,
          payload?.cardIndex ?? -1,
          payload?.targetPlayerId ?? "",
          payload?.targetCardIndex ?? -1,
        );
        break;
      }

      case "SKIP_SPECIAL": {
        if (!room.gameState) {
          return NextResponse.json(
            { error: "Game not started" },
            { status: 400 },
          );
        }
        gameState = skipSpecial(room.gameState, playerId);
        break;
      }

      case "CALL_PABLO": {
        if (!room.gameState) {
          return NextResponse.json(
            { error: "Game not started" },
            { status: 400 },
          );
        }
        gameState = callPablo(room.gameState, playerId);
        break;
      }

      case "SKIP_TURN": {
        if (!room.gameState) {
          return NextResponse.json(
            { error: "Game not started" },
            { status: 400 },
          );
        }
        gameState = skipTurn(room.gameState, playerId);
        break;
      }

      case "REMATCH_READY": {
        if (!room.gameState) {
          return NextResponse.json(
            { error: "Game not started" },
            { status: 400 },
          );
        }
        gameState = rematchReady(room.gameState, playerId);
        break;
      }

      case "START_NEW_ROUND": {
        if (!room.gameState) {
          return NextResponse.json(
            { error: "Game not started" },
            { status: 400 },
          );
        }
        gameState = startNewRound(room.gameState, playerId, room.players);
        break;
      }

      default:
        return NextResponse.json(
          { error: `Unknown action type: ${type}` },
          { status: 400 },
        );
    }

    // Update stored state
    await updateGameState(roomCode, gameState);

    // Broadcast event (stub — logs to console)
    await broadcastEvent(
      createEvent("STATE_SYNC", roomCode, playerId, { action: type }),
    );

    // Return sanitized state for the requesting player
    return NextResponse.json({
      success: true,
      gameState: sanitizeGameStateForPlayer(gameState, playerId),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to process game action";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

/**
 * Sanitize game state for a specific player — hide opponents' face-down cards and secret drawn cards
 */
export function sanitizeGameStateForPlayer(
  state: GameState,
  playerId: string,
): GameState {
  const isCurrentTurnPlayer =
    state.players[state.currentPlayerIndex]?.id === playerId;

  return {
    ...state,
    // Only reveal secret drawn card from draw pile to the current active player
    drawnCard: state.drawnCard
      ? !isCurrentTurnPlayer && state.turnStep === "drawn_from_pile"
        ? {
            id: "hidden-drawn",
            rank: "?" as never,
            suit: "?" as never,
            faceUp: false,
          }
        : state.drawnCard
      : null,
    players: state.players.map((player) => {
      const isSelf = player.id === playerId;

      return {
        ...player,
        cards: player.cards.map((card, index) => {
          const isPeekedBySelf =
            isSelf && player.peekedCardIndices?.includes(index);
          const shouldReveal =
            card.faceUp ||
            state.phase === "game_over" ||
            state.phase === "reveal" ||
            isPeekedBySelf;

          if (shouldReveal) {
            return card;
          }

          return {
            id: `hidden-${player.id}-${index}`,
            rank: "?" as never,
            suit: "?" as never,
            faceUp: false,
          };
        }),
        peekedCardIndices: isSelf ? player.peekedCardIndices || [] : [], // Don't reveal what opponents have peeked
      };
    }),
    // Hide draw pile contents
    drawPile: state.drawPile.map((_, index) => ({
      id: `hidden-draw-pile-${index}`,
      rank: "?" as never,
      suit: "?" as never,
      faceUp: false,
    })),
  };
}
