import Pusher from 'pusher';

const appId = process.env.PUSHER_APP_ID;
const key = process.env.PUSHER_KEY;
const secret = process.env.PUSHER_SECRET;
const cluster = process.env.PUSHER_CLUSTER;

/** Pusher is optional for local development, but required in production. */
export const pusher = appId && key && secret && cluster
  ? new Pusher({ appId, key, secret, cluster, useTLS: true })
  : null;

export function getRoomChannelName(roomCode: string): string {
  return `pablo-room-${roomCode.toUpperCase()}`;
}
