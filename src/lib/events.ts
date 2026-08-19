// ============================================================================
// Pablo Card Game — Realtime room invalidation events
// ============================================================================

import { GameEvent, GameEventType } from './game/types';
import { getRoomChannelName, pusher } from './pusher-server';

export function createEvent(
  type: GameEventType,
  roomCode: string,
  playerId?: string,
  data?: Record<string, unknown>
): GameEvent {
  return { type, roomCode, playerId, data, timestamp: Date.now() };
}

/**
 * Sends a small invalidation event. Game data stays in Upstash Redis and every
 * recipient fetches only its own sanitized state after the notification.
 */
export async function broadcastEvent(event: GameEvent): Promise<void> {
  if (!pusher) {
    console.warn('Pusher is not configured; clients will use fallback polling.');
    return;
  }

  try {
    await pusher.trigger(getRoomChannelName(event.roomCode), 'room-updated', event);
  } catch (error) {
    // Redis already holds the source of truth; a later refresh can recover.
    console.error('Pusher broadcast error:', error);
  }
}
