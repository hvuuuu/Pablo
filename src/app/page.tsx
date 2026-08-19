'use client';
// ============================================================================
// Landing Page — Pablo Card Game
// ============================================================================

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Users, Zap, Shuffle, SquareArrowOutUpRight, CirclePlus, Brain } from 'lucide-react';
import CreateRoomForm from '@/components/lobby/CreateRoomForm';
import JoinRoomForm from '@/components/lobby/JoinRoomForm';
import PabloLogo from '@/components/PabloLogo';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type Tab = 'create' | 'join';

// Floating card decoration
function FloatingCard({ delay, x, y, rotation, suit, rank }: {
  delay: number; x: string; y: string; rotation: number; suit: string; rank: string;
}) {
  const isRed = suit === '♥' || suit === '♦';
  return (
    <motion.div
      className="absolute pointer-events-none select-none"
      style={{ left: x, top: y }}
      initial={{ opacity: 0, rotate: rotation - 10, scale: 0.8 }}
      animate={{
        opacity: [0, 0.15, 0.15, 0],
        rotate: [rotation - 5, rotation + 5, rotation - 5],
        y: [0, -15, 0],
      }}
      transition={{
        delay,
        duration: 8,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      <div className="w-16 h-22 rounded-lg border border-white/10 bg-slate-800/50 backdrop-blur-sm p-2 flex flex-col items-start">
        <span className={cn('text-xs font-bold', isRed ? 'text-red-400/50' : 'text-slate-400/50')}>
          {rank}
        </span>
        <span className={cn('text-2xl mx-auto', isRed ? 'text-red-400/30' : 'text-slate-400/30')}>
          {suit}
        </span>
      </div>
    </motion.div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('create');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateRoom = useCallback(async (name: string, emoji: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/room/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName: name, emoji }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Store player info in sessionStorage for the game page
      sessionStorage.setItem('pablo_player_id', data.playerId);
      sessionStorage.setItem('pablo_player_name', name);
      sessionStorage.setItem('pablo_player_emoji', emoji);

      router.push(`/room/${data.room.code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const handleJoinRoom = useCallback(async (code: string, name: string, emoji: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/room/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode: code, playerName: name, emoji }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      sessionStorage.setItem('pablo_player_id', data.playerId);
      sessionStorage.setItem('pablo_player_name', name);
      sessionStorage.setItem('pablo_player_emoji', emoji);

      router.push(`/room/${data.room.code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join room');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-background">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/20 via-background to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/10 via-transparent to-transparent" />

      {/* Floating cards decoration */}
      <FloatingCard delay={0} x="5%" y="15%" rotation={-15} suit="♠" rank="K" />
      <FloatingCard delay={1.5} x="85%" y="20%" rotation={12} suit="♥" rank="A" />
      <FloatingCard delay={3} x="10%" y="70%" rotation={-8} suit="♦" rank="7" />
      <FloatingCard delay={2} x="80%" y="65%" rotation={20} suit="♣" rank="9" />
      <FloatingCard delay={4} x="50%" y="10%" rotation={5} suit="♠" rank="Q" />
      <FloatingCard delay={2.5} x="70%" y="80%" rotation={-12} suit="♥" rank="8" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-md mx-auto px-6 py-12">
        {/* Logo / Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <PabloLogo animated size="xl" className="mb-4" />

          <h1 className="text-5xl font-black text-white tracking-tight mb-2">
            PABL
            <span className="text-emerald-400">O</span>
          </h1>
          <p className="text-slate-400 text-sm max-w-xs mx-auto">
            A fast-paced Memory/Golf card game. Remember your cards, outsmart your opponents!
          </p>
        </motion.div>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap justify-center gap-2 mb-8"
        >
          {[
            { icon: Users, label: '2-6 Players' },
            { icon: Brain, label: 'Memory' },
            { icon: Shuffle, label: 'Swap' },
            { icon: Zap, label: 'Specials' },
          ].map(({ icon: Icon, label }) => (
            <Badge
              key={label}
              variant="outline"
              className="gap-1.5 px-3 py-1 bg-slate-800/60 border-slate-700/50 text-slate-300 text-xs font-normal"
            >
              <Icon className="w-3.5 h-3.5 text-emerald-400" />
              <span>{label}</span>
            </Badge>
          ))}
        </motion.div>

        {/* Tab selector */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex gap-1 p-1 bg-slate-800/50 rounded-xl border border-slate-700/50 mb-4">
            {[
              { key: 'create' as Tab, label: 'Create Room', icon: CirclePlus },
              { key: 'join' as Tab, label: 'Join Room', icon: SquareArrowOutUpRight },
            ].map(({ key, label, icon: Icon }) => (
              <Button
                key={key}
                variant="ghost"
                onClick={() => { setActiveTab(key); setError(null); }}
                className={cn(
                  'flex-1 h-10 gap-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer',
                  activeTab === key
                    ? 'bg-slate-700/90 text-white shadow-sm hover:bg-slate-700 hover:text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-red-900/30 border border-red-500/30 rounded-lg px-3 py-2 mb-4"
            >
              <p className="text-xs text-red-300">{error}</p>
            </motion.div>
          )}

          {/* Forms */}
          <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-5 backdrop-blur-sm">
            {activeTab === 'create' ? (
              <CreateRoomForm onCreateRoom={handleCreateRoom} isLoading={isLoading} />
            ) : (
              <JoinRoomForm onJoinRoom={handleJoinRoom} isLoading={isLoading} />
            )}
          </div>
        </motion.div>

        {/* Quick play demo link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-6"
        >
          <Button
            variant="link"
            size="sm"
            onClick={() => router.push('/game/demo')}
            className="text-xs text-slate-500 hover:text-emerald-400 font-medium"
          >
            or try a quick local demo →
          </Button>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="relative z-10 pb-6 text-center">
        <p className="text-xs text-slate-700">
          K♠ = 0pts (Best!) • A = 1pt • 7/8/9 = Special • Call PABLO when you&apos;re lowest!
        </p>
      </div>
    </div>
  );
}
