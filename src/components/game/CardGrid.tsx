'use client';
// ============================================================================
// CardGrid — 2x2 grid of player's cards with position highlighting
// ============================================================================

import { Card } from '@/lib/game/types';
import PlayingCard from './PlayingCard';
import { cn } from '@/lib/utils';

interface CardGridProps {
  cards: Card[];
  peekedIndices?: number[];
  selectedIndex?: number | null;
  selectedIndices?: number[];
  highlightedSlot?: number | null;     // Slot index to highlight (recent exchange)
  highlightLabel?: string;
  selectable?: boolean;
  onCardClick?: (index: number) => void;
  size?: 'sm' | 'md' | 'lg';
  showFaceUp?: boolean;                // Force all face-up (game over)
  className?: string;
  label?: string;
}

export default function CardGrid({
  cards,
  peekedIndices = [],
  selectedIndex = null,
  selectedIndices,
  highlightedSlot = null,
  selectable = false,
  onCardClick,
  size = 'md',
  showFaceUp = false,
  className,
  label,
}: CardGridProps) {
  if (cards.length === 0) return null;

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      {label && (
        <span className="text-xs text-muted-foreground mb-1 font-medium tracking-wide uppercase">
          {label}
        </span>
      )}
      <div className="grid grid-cols-2 gap-2">
        {cards.map((card, index) => {
          const isPeeked = peekedIndices.includes(index);
          const isCardFaceUp = Boolean(showFaceUp || card.faceUp || isPeeked);
          const isSelected = selectedIndices
            ? selectedIndices.includes(index)
            : selectedIndex === index;
          const isHighlighted = highlightedSlot === index;

          return (
            <div key={card.id || `card-${index}`} className="relative">
              <PlayingCard
                card={card}
                faceUp={isCardFaceUp}
                size={size}
                selected={isSelected}
                selectable={selectable}
                peeked={isPeeked}
                highlighted={isHighlighted}
                onClick={() => onCardClick?.(index)}
                index={index}
                className={cn(
                  isHighlighted && 'card-highlight-gold ring-4 ring-yellow-400 ring-offset-2 ring-offset-slate-950 z-10',
                  isSelected && 'ring-4 ring-yellow-400 shadow-lg shadow-yellow-400/40'
                )}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
