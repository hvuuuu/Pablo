// ============================================================================
// Pablo Card Game — Room Manager (Upstash Redis + In-Memory Fallback)
// ============================================================================

import { Room, Player } from './types';
import { GAME_CONFIG, PLAYER_COLORS, PLAYER_EMOJIS } from './constants';
import { nanoid } from 'nanoid';
import { redis } from '../redis';

// In-memory fallback for local development or when Redis is unavailable
const globalRooms = globalThis as unknown as {
  __pablo_rooms?: Map<string, Room>;
};

if (!globalRooms.__pablo_rooms) {
  globalRooms.__pablo_rooms = new Map<string, Room>();
}

const localRooms = globalRooms.__pablo_rooms;
const ROOM_TTL_SECONDS = 86400; // 24 hours

/**
 * Helper to get Redis room key
 */
function getRoomKey(code: string): string {
  return `pablo:room:${code.toUpperCase()}`;
}

/**
 * Save room to Redis and local memory
 */
async function saveRoom(room: Room): Promise<void> {
  const code = room.code.toUpperCase();
  localRooms.set(code, room);

  if (redis) {
    try {
      await redis.set(getRoomKey(code), JSON.stringify(room), { ex: ROOM_TTL_SECONDS });
    } catch (err) {
      console.error('Redis saveRoom error:', err);
    }
  }
}

/**
 * Generate a unique 6-character room code (uppercase alphanumeric)
 */
async function generateRoomCode(): Promise<string> {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < GAME_CONFIG.ROOM_CODE_LENGTH; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }

  // Ensure uniqueness in Redis/Memory
  const existing = await getRoom(code);
  if (existing) return generateRoomCode();
  return code;
}

/**
 * Get a room by code
 */
export async function getRoom(code: string): Promise<Room | undefined> {
  const normalizedCode = code.toUpperCase();

  if (redis) {
    try {
      const data = await redis.get<string | Room>(getRoomKey(normalizedCode));
      if (data) {
        const room: Room = typeof data === 'string' ? JSON.parse(data) : data;
        localRooms.set(normalizedCode, room);
        return room;
      }
    } catch (err) {
      console.error('Redis getRoom error:', err);
    }
  }

  return localRooms.get(normalizedCode);
}

/**
 * Create a new game room
 */
export async function createRoom(hostName: string, hostEmoji?: string): Promise<Room> {
  const code = await generateRoomCode();
  const hostId = nanoid(12);

  const host: Player = {
    id: hostId,
    name: hostName,
    color: PLAYER_COLORS[0],
    emoji: hostEmoji || PLAYER_EMOJIS[0],
    cards: [],
    isHost: true,
    isReady: true,
    isConnected: true,
    peekedCardIndices: [],
  };

  const room: Room = {
    code,
    players: [host],
    hostId,
    gameState: null,
    createdAt: Date.now(),
    maxPlayers: GAME_CONFIG.MAX_PLAYERS,
  };

  await saveRoom(room);
  return room;
}

/**
 * Join an existing room
 */
export async function joinRoom(
  code: string,
  playerName: string,
  playerEmoji?: string
): Promise<{ room: Room; playerId: string }> {
  const room = await getRoom(code);
  if (!room) throw new Error('Room not found');
  if (room.players.length >= room.maxPlayers) throw new Error('Room is full');

  // Check for duplicate names
  if (room.players.some(p => p.name.toLowerCase() === playerName.toLowerCase())) {
    throw new Error('Name already taken in this room');
  }

  const isMidGame = Boolean(room.gameState && room.gameState.phase !== 'game_over');
  const playerId = nanoid(12);
  const playerIndex = room.players.length;

  const player: Player = {
    id: playerId,
    name: playerName,
    color: PLAYER_COLORS[playerIndex % PLAYER_COLORS.length],
    emoji: playerEmoji || PLAYER_EMOJIS[playerIndex % PLAYER_EMOJIS.length],
    cards: [],
    isHost: false,
    isReady: false,
    isConnected: true,
    isWaiting: isMidGame,
    peekedCardIndices: [],
  };

  room.players.push(player);

  // If game is in progress, also sync into active gameState as spectator
  if (room.gameState) {
    room.gameState.players = [...room.gameState.players, player];
  }

  await saveRoom(room);
  return { room, playerId };
}

/**
 * Toggle player ready status
 */
export async function toggleReady(code: string, playerId: string): Promise<Room> {
  const room = await getRoom(code);
  if (!room) throw new Error('Room not found');

  const player = room.players.find(p => p.id === playerId);
  if (!player) throw new Error('Player not found');

  player.isReady = !player.isReady;
  await saveRoom(room);
  return room;
}

/**
 * Remove a player from a room
 */
export async function leaveRoom(code: string, playerId: string): Promise<Room | null> {
  const room = await getRoom(code);
  if (!room) return null;

  room.players = room.players.filter(p => p.id !== playerId);

  if (room.gameState) {
    room.gameState.players = room.gameState.players.filter(p => p.id !== playerId);
    if (room.gameState.rematchVotes) {
      room.gameState.rematchVotes = room.gameState.rematchVotes.filter(id => id !== playerId);
    }
  }

  // If room is empty, delete it
  if (room.players.length === 0) {
    await deleteRoom(code);
    return null;
  }

  // If host left, assign new host
  if (room.hostId === playerId) {
    room.hostId = room.players[0].id;
    room.players[0].isHost = true;
    if (room.gameState && room.gameState.players[0]) {
      room.gameState.players[0].isHost = true;
    }
  }

  await saveRoom(room);
  return room;
}

/**
 * Update room's game state
 */
export async function updateGameState(code: string, gameState: Room['gameState']): Promise<Room> {
  const room = await getRoom(code);
  if (!room) throw new Error('Room not found');
  room.gameState = gameState;
  await saveRoom(room);
  return room;
}

/**
 * Check if all players are ready
 */
export async function allPlayersReady(code: string): Promise<boolean> {
  const room = await getRoom(code);
  if (!room) return false;
  return room.players.length >= GAME_CONFIG.MIN_PLAYERS && room.players.every(p => p.isReady);
}

/**
 * Delete a room
 */
export async function deleteRoom(code: string): Promise<void> {
  const normalizedCode = code.toUpperCase();
  localRooms.delete(normalizedCode);

  if (redis) {
    try {
      await redis.del(getRoomKey(normalizedCode));
    } catch (err) {
      console.error('Redis deleteRoom error:', err);
    }
  }
}
