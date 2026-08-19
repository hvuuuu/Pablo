'use client';
// ============================================================================
// ActionLog — Scrollable game event log sidebar
// ============================================================================

import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollText, ArrowDown } from 'lucide-react';
import { ActionLogEntry } from '@/lib/game/types';
import { cn } from '@/lib/utils';

interface ActionLogProps {
  entries: ActionLogEntry[];
  className?: string;
  collapsed?: boolean;
}

export default function ActionLog({ entries, className, collapsed = false }: ActionLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries.length]);

  if (collapsed) return null;

  return (
    <div className={cn(
      'bg-slate-900/80 border border-slate-800 rounded-xl backdrop-blur-sm overflow-hidden',
      className
    )}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-800">
        <ScrollText className="w-4 h-4 text-emerald-400" />
        <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Activity Log</span>
      </div>

      {/* Log entries */}
      <div ref={scrollRef} className="max-h-48 md:max-h-72 overflow-y-auto p-2 space-y-1">
        <AnimatePresence initial={false}>
          {entries.length === 0 ? (
            <div className="flex items-center justify-center py-4">
              <span className="text-xs text-slate-600">Game events will appear here...</span>
            </div>
          ) : (
            entries.map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -10, height: 0 }}
                animate={{ opacity: 1, x: 0, height: 'auto' }}
                className="flex items-start gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-800/50 transition-colors"
              >
                <span className="text-[10px] text-slate-600 font-mono shrink-0 mt-0.5">
                  {new Date(entry.timestamp).toLocaleTimeString('en-US', { 
                    hour12: false, 
                    hour: '2-digit', 
                    minute: '2-digit',
                    second: '2-digit' 
                  })}
                </span>
                <div className="min-w-0">
                  <span className="text-xs">
                    <span className="text-emerald-400 font-medium">{entry.playerName}</span>
                    {' '}
                    <span className="text-slate-400">{entry.action}</span>
                  </span>
                  {entry.detail && (
                    <p className="text-[10px] text-slate-500 truncate">{entry.detail}</p>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Scroll indicator */}
      {entries.length > 5 && (
        <div className="flex justify-center pb-1">
          <ArrowDown className="w-3 h-3 text-slate-600 animate-bounce" />
        </div>
      )}
    </div>
  );
}
