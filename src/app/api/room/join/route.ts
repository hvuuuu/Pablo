// ============================================================================
// POST /api/room/join — Join an existing game room
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { joinRoom } from '@/lib/game/room-manager';
import { broadcastEvent, createEvent } from '@/lib/events';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomCode, playerName, emoji } = body;

    if (!roomCode || typeof roomCode !== 'string') {
      return NextResponse.json(
        { error: 'Room code is required' },
        { status: 400 }
      );
    }

    if (!playerName || typeof playerName !== 'string' || playerName.trim().length === 0) {
      return NextResponse.json(
        { error: 'Player name is required' },
        { status: 400 }
      );
    }

    if (playerName.trim().length > 20) {
      return NextResponse.json(
        { error: 'Player name must be 20 characters or less' },
        { status: 400 }
      );
    }

    const { room, playerId } = await joinRoom(roomCode.trim(), playerName.trim(), emoji);
    await broadcastEvent(createEvent('PLAYER_JOINED', room.code, playerId));

    return NextResponse.json({
      success: true,
      room: {
        code: room.code,
        players: room.players,
        hostId: room.hostId,
      },
      playerId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to join room';
    const status = message.includes('not found') ? 404 :
                   message.includes('full') ? 403 :
                   message.includes('in progress') ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
