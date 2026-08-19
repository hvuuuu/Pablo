// ============================================================================
// POST /api/room/create — Create a new game room
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createRoom } from '@/lib/game/room-manager';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { playerName, emoji } = body;

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

    const room = await createRoom(playerName.trim(), emoji);

    return NextResponse.json({
      success: true,
      room: {
        code: room.code,
        players: room.players,
        hostId: room.hostId,
      },
      playerId: room.players[0].id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create room';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
