'use client';
// ============================================================================
// CreateRoomForm — Create a new game room
// ============================================================================

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, CirclePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PLAYER_EMOJIS } from '@/lib/game/constants';
import { cn } from '@/lib/utils';

interface CreateRoomFormProps {
  onCreateRoom: (name: string, emoji: string) => void;
  isLoading?: boolean;
}

export default function CreateRoomForm({ onCreateRoom, isLoading }: CreateRoomFormProps) {
  const [name, setName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState(PLAYER_EMOJIS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreateRoom(name.trim(), selectedEmoji);
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
          Your Name
        </label>
        <Input
          type="text"
          placeholder="Enter your name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={20}
          className="bg-slate-800/50 border-slate-700 focus:border-emerald-500 text-white placeholder:text-slate-600"
          autoFocus
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
        disabled={!name.trim() || isLoading}
        className="w-full tracking-wider uppercase"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <CirclePlus className="w-4 h-4" />
        )}
        Create Room
      </Button>
    </motion.form>
  );
}
