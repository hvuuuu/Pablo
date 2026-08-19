// ============================================================================
// GET /api/game/state — Fetch sanitized game state for a player
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getRoom, updateGameState } from '@/lib/game/room-manager';
import { checkTimeouts } from '@/lib/game/engine';
import { sanitizeGameStateForPlayer } from '../action/route';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roomCode = searchParams.get('roomCode');
    const playerId = searchParams.get('playerId');

    if (!roomCode || !playerId) {
      return NextResponse.json(
        { error: 'roomCode and playerId are required query parameters' },
        { status: 400 }
      );
    }

    const room = await getRoom(roomCode);
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if (!room.gameState) {
      return NextResponse.json({ error: 'Game not started' }, { status: 400 });
    }

    const updatedState = checkTimeouts(room.gameState);
    if (updatedState !== room.gameState) {
      await updateGameState(roomCode, updatedState);
    }

    return NextResponse.json({
      success: true,
      gameState: sanitizeGameStateForPlayer(updatedState, playerId),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch game state';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
