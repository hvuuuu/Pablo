'use client';
// ============================================================================
// JoinRoomForm — Join an existing room by code
// ============================================================================

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, SquareArrowOutUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PLAYER_EMOJIS } from '@/lib/game/constants';
import { cn } from '@/lib/utils';

interface JoinRoomFormProps {
  onJoinRoom: (code: string, name: string, emoji: string) => void;
  isLoading?: boolean;
  initialCode?: string;
}

export default function JoinRoomForm({ onJoinRoom, isLoading, initialCode }: JoinRoomFormProps) {
  const [code, setCode] = useState(initialCode || '');
  const [name, setName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState(PLAYER_EMOJIS[1]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim() && name.trim()) {
      onJoinRoom(code.trim().toUpperCase(), name.trim(), selectedEmoji);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <div>
        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">
          Room Code
        </label>
        <Input
          type="text"
          placeholder="Enter 6-character code..."
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
          maxLength={6}
          className="bg-slate-800/50 border-slate-700 focus:border-blue-500 text-white placeholder:text-slate-600 font-mono text-center text-lg tracking-[0.3em] uppercase"
          autoFocus={!initialCode}
        />
      </div>

      <div>
        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">
          Your Name
        </label>
        <Input
          type="text"
          placeholder="Enter your name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={20}
          className="bg-slate-800/50 border-slate-700 focus:border-blue-500 text-white placeholder:text-slate-600"
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
                  ? 'border-blue-500 bg-blue-900/30 scale-110'
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
        size="xl"
        disabled={code.length < 6 || !name.trim() || isLoading}
        className="w-full bg-blue-600 hover:bg-blue-500 text-white tracking-wider uppercase shadow-lg shadow-blue-950/40"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <SquareArrowOutUpRight className="w-4 h-4" />
        )}
        Join Room
      </Button>
    </motion.form>
  );
}
