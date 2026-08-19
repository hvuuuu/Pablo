'use client';
// ============================================================================
// Room Lobby Page — /room/[code]
// ============================================================================

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Copy, Check, Play, ArrowLeft, Loader2, LogIn, Sparkles } from 'lucide-react';
import PlayerList from '@/components/lobby/PlayerList';
import { Player } from '@/lib/game/types';
import { PLAYER_EMOJIS } from '@/lib/game/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { getPusherClient, getRoomChannelName } from '@/lib/pusher-client';

interface RoomData {
  code: string;
  players: Player[];
  hostId: string;
  gameState?: unknown;
}

export default function RoomPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const router = useRouter();
  const [room, setRoom] = useState<RoomData | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('pablo_player_id');
    }
    return null;
  });
  const [joinName, setJoinName] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('pablo_player_name') || '';
    }
    return '';
  });
  const [selectedEmoji, setSelectedEmoji] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('pablo_player_emoji') || PLAYER_EMOJIS[1];
    }
    return PLAYER_EMOJIS[1];
  });
  const [isJoining, setIsJoining] = useState(false);
  const [copied, setCopied] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch once, then receive immediate updates through Pusher. A slow fallback
  // keeps local development usable when Pusher credentials are not configured.
  useEffect(() => {
    let disposed = false;
    const fetchRoom = async () => {
      try {
        const res = await fetch(`/api/room/${code}`);
        const data = await res.json();
        if (res.ok && data.room) {
          if (disposed) return;
          setRoom(data.room);
          // If game started, redirect to game page
          if (data.room.gameState) {
            router.push(`/game/${code}`);
          }
        } else if (res.status === 404) {
          if (!disposed) setError('Room not found or expired.');
        }
      } catch {
        // Silently retry
      }
    };

    fetchRoom();

    const pusher = getPusherClient();
    if (pusher) {
      const channel = pusher.subscribe(getRoomChannelName(code));
      channel.bind('room-updated', fetchRoom);
      pusher.connection.bind('connected', fetchRoom);

      return () => {
        disposed = true;
        channel.unbind('room-updated', fetchRoom);
        pusher.connection.unbind('connected', fetchRoom);
        pusher.unsubscribe(getRoomChannelName(code));
      };
    }

    const interval = setInterval(fetchRoom, 15000);
    return () => {
      disposed = true;
      clearInterval(interval);
    };
  }, [code, router]);

  const handleCopyCode = useCallback(() => {
    navigator.clipboard.writeText(code.toUpperCase());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  const handleJoinLobby = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinName.trim()) return;

    setIsJoining(true);
    setError(null);
    try {
      const res = await fetch('/api/room/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode: code,
          playerName: joinName.trim(),
          emoji: selectedEmoji,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      sessionStorage.setItem('pablo_player_id', data.playerId);
      sessionStorage.setItem('pablo_player_name', joinName.trim());
      sessionStorage.setItem('pablo_player_emoji', selectedEmoji);

      setPlayerId(data.playerId);
      if (data.room) setRoom(data.room);
      if (data.room?.gameState) {
        router.push(`/game/${code}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join room');
    } finally {
      setIsJoining(false);
    }
  }, [code, joinName, selectedEmoji, router]);

  const handleToggleReady = useCallback(async () => {
    if (!playerId) return;
    try {
      const res = await fetch(`/api/room/${code}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ready', playerId }),
      });
      const data = await res.json();
      if (res.ok && data.room) {
        setRoom(data.room);
      }
    } catch {
      // Retry on next poll
    }
  }, [code, playerId]);

  const handleStartGame = useCallback(async () => {
    if (!playerId) return;
    setStarting(true);
    setError(null);
    try {
      const res = await fetch('/api/game/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'START_GAME',
          playerId,
          roomCode: code,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/game/${code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start game');
      setStarting(false);
    }
  }, [code, playerId, router]);

  if (!room && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (error && !room) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <div className="bg-red-900/30 border border-red-500/40 rounded-2xl p-6 text-center max-w-sm">
          <p className="text-red-300 font-semibold mb-4">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/')}
            className="bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-medium"
          >
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const isJoined = Boolean(playerId && room?.players.some(p => p.id === playerId));
  const isHost = room?.hostId === playerId;
  const currentPlayerInfo = room?.players.find(p => p.id === playerId);
  const isReady = currentPlayerInfo?.isReady ?? false;
  const allReady = (room?.players.length ?? 0) >= 2 && room?.players.every(p => p.isReady);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/')}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-300 mb-6 p-0 h-auto hover:bg-transparent"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Button>

        {/* Room header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <h2 className="text-xl font-bold text-white mb-2">Game Lobby</h2>
          
          {/* Room code */}
          <Button
            variant="outline"
            onClick={handleCopyCode}
            className="inline-flex items-center gap-2 h-auto px-5 py-3 bg-slate-800/60 border-slate-700 rounded-xl hover:bg-slate-800 hover:text-white group"
          >
            <span className="text-2xl font-mono font-black text-emerald-400 tracking-[0.3em]">
              {code.toUpperCase()}
            </span>
            {copied ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4 text-slate-500 group-hover:text-slate-300" />
            )}
          </Button>
          <p className="text-xs text-slate-500 mt-2">
            Share this code with friends to join
          </p>
        </motion.div>

        {/* Error */}
        {error && (
          <div className="bg-red-900/30 border border-red-500/30 rounded-lg px-3 py-2 mb-4">
            <p className="text-xs text-red-300">{error}</p>
          </div>
        )}

        {/* Not joined yet -> Join Prompt Form */}
        {!isJoined ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/80 border border-emerald-700/40 rounded-2xl p-6 backdrop-blur-md shadow-2xl"
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-white text-base">Enter your details to join</h3>
            </div>

            <form onSubmit={handleJoinLobby} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">
                  Your Nickname
                </label>
                <Input
                  type="text"
                  placeholder="Enter your name..."
                  value={joinName}
                  onChange={(e) => setJoinName(e.target.value)}
                  maxLength={20}
                  required
                  autoFocus
                  className="bg-slate-800/60 border-slate-700 focus:border-emerald-500 text-white placeholder:text-slate-600"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">
                  Choose Avatar
                </label>
                <div className="flex flex-wrap gap-2">
                  {PLAYER_EMOJIS.slice(0, 8).map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setSelectedEmoji(emoji)}
                      className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center text-xl border-2 transition-all cursor-pointer',
                        selectedEmoji === emoji
                          ? 'border-emerald-500 bg-emerald-900/30 scale-110'
                          : 'border-slate-700 bg-slate-800/50 hover:border-slate-500'
                      )}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                variant="emerald"
                size="xl"
                disabled={!joinName.trim() || isJoining}
                className="w-full uppercase tracking-wider"
              >
                {isJoining ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LogIn className="w-4 h-4" />
                )}
                Join Game Room
              </Button>
            </form>
          </motion.div>
        ) : (
          /* Joined -> Lobby Screen */
          <>
            {/* Player list */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-5 backdrop-blur-sm mb-4"
            >
              <PlayerList
                players={room?.players || []}
                currentPlayerId={playerId || ''}
              />
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="space-y-3"
            >
              {/* Ready button */}
              {!isHost && (
                <Button
                  onClick={handleToggleReady}
                  variant={isReady ? "secondary" : "emerald"}
                  size="xl"
                  className={cn(
                    'w-full uppercase tracking-wider',
                    isReady && 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                  )}
                >
                  {isReady ? 'Cancel Ready' : 'Ready Up'}
                </Button>
              )}

              {/* Start game button (host only) */}
              {isHost && (
                <Button
                  onClick={handleStartGame}
                  disabled={!allReady || starting}
                  variant={allReady && !starting ? "emerald" : "secondary"}
                  size="xl"
                  className={cn(
                    'w-full uppercase tracking-wider',
                    (!allReady || starting) && 'bg-slate-700 text-slate-500'
                  )}
                >
                  {starting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  {starting ? 'Starting...' : allReady ? 'Start Game' : `Waiting for players (${room?.players.filter(p => p.isReady).length}/${room?.players.length} ready)`}
                </Button>
              )}
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
