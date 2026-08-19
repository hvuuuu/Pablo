// ============================================================================
// GET /api/room/[code] — Fetch room state
// POST /api/room/[code] — Room actions (ready, leave)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getRoom, toggleReady, leaveRoom } from '@/lib/game/room-manager';
import { broadcastEvent, createEvent } from '@/lib/events';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const room = await getRoom(code);

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      room: {
        code: room.code,
        players: room.players,
        hostId: room.hostId,
        gameState: room.gameState ? {
          phase: room.gameState.phase,
          currentPlayerIndex: room.gameState.currentPlayerIndex,
          turnStep: room.gameState.turnStep,
        } : null,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get room';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await request.json();
    const { action, playerId } = body;

    if (!playerId) {
      return NextResponse.json(
        { error: 'Player ID is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'ready': {
        const room = await toggleReady(code, playerId);
        await broadcastEvent(createEvent('PLAYER_READY', room.code, playerId));
        return NextResponse.json({
          success: true,
          room: {
            code: room.code,
            players: room.players,
            hostId: room.hostId,
          },
        });
      }
      case 'leave': {
        const room = await leaveRoom(code, playerId);
        if (room) await broadcastEvent(createEvent('PLAYER_LEFT', room.code, playerId));
        return NextResponse.json({
          success: true,
          room: room ? {
            code: room.code,
            players: room.players,
            hostId: room.hostId,
          } : null,
        });
      }
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to process action';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
