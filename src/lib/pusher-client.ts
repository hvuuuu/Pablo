'use client';

import Pusher from 'pusher-js';

const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

let client: Pusher | null | undefined;

export function getPusherClient(): Pusher | null {
  if (client !== undefined) return client;
  client = key && cluster ? new Pusher(key, { cluster, forceTLS: true }) : null;
  return client;
}

export function getRoomChannelName(roomCode: string): string {
  return `pablo-room-${roomCode.toUpperCase()}`;
}
