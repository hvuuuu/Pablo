'use client';
// ============================================================================
// PlayingCard — Individual card with flip animation
// ============================================================================

import { motion } from 'framer-motion';
import { Card } from '@/lib/game/types';
import { SUIT_SYMBOLS } from '@/lib/game/constants';
import { cn } from '@/lib/utils';

interface PlayingCardProps {
  card: Card;
  faceUp?: boolean;       // Override card's faceUp state
  size?: 'sm' | 'md' | 'lg';
  selected?: boolean;
  selectable?: boolean;
  highlighted?: boolean;
  peeked?: boolean;       // Temporarily peeked (during special ability)
  onClick?: () => void;
  className?: string;
  animateFlip?: boolean;
  index?: number;         // For stagger animations
}

const suitColorMap = {
  hearts: 'text-red-600',
  diamonds: 'text-red-600',
  spades: 'text-slate-950',
  clubs: 'text-slate-950',
};

const sizeClasses = {
  sm: 'card-size-sm text-xs',
  md: 'card-size-md text-sm',
  lg: 'card-size-lg text-base',
};

export default function PlayingCard({
  card,
  faceUp: faceUpOverride,
  size = 'md',
  selected = false,
  selectable = false,
  highlighted = false,
  peeked = false,
  onClick,
  className,
  animateFlip = true,
  index = 0,
}: PlayingCardProps) {
  const isFaceUp = typeof faceUpOverride === 'boolean' 
    ? faceUpOverride 
    : Boolean(card.faceUp || peeked);

  const isClickable = selectable && onClick;
  const suitSymbol = SUIT_SYMBOLS[card.suit] || '?';
  const suitColor = suitColorMap[card.suit] || 'text-slate-950';
  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';

  const isKingOfSpades = card.rank === 'K' && card.suit === 'spades';

  return (
    <motion.div
      initial={animateFlip ? { scale: 0.8, opacity: 0 } : false}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: index * 0.08, duration: 0.3 }}
      className={cn(
        'card-container select-none',
        sizeClasses[size],
        isClickable && 'card-hoverable cursor-pointer',
        selected && 'card-selected',
        highlighted && 'glow-emerald',
        className
      )}
      onClick={isClickable ? onClick : undefined}
      whileHover={isClickable ? { y: -4 } : undefined}
      whileTap={isClickable ? { scale: 0.95 } : undefined}
    >
      <div className={cn('card-inner', isFaceUp && 'flipped')}>
        {/* Card Back */}
        <div className="card-back rounded-lg border border-blue-900/60 overflow-hidden shadow-md">
          <div className="w-full h-full card-back-pattern flex items-center justify-center">
            <div className="w-[60%] h-[70%] rounded border border-blue-400/30 flex items-center justify-center bg-blue-900/50 shadow-inner">
              <span 
                className="text-blue-300 font-black tracking-tighter" 
                style={{ fontSize: size === 'sm' ? '12px' : size === 'md' ? '16px' : '20px' }}
              >
                P
              </span>
            </div>
          </div>
        </div>

        {/* Card Front */}
        <div className={cn(
          'card-front rounded-lg border overflow-hidden shadow-md relative',
          'bg-gradient-to-b from-white via-slate-50 to-slate-100',
          isRed ? 'border-red-200' : 'border-slate-300',
          peeked && 'ring-2 ring-amber-400',
          isKingOfSpades && 'ring-2 ring-amber-400/80 bg-gradient-to-b from-amber-50/50 via-white to-slate-100'
        )}>
          {/* Top-Left: Rank & Suit Icon */}
          <div className={cn('absolute top-1.5 left-1.5 flex flex-col items-center leading-none select-none', suitColor)}>
            <span 
              className="font-black leading-none tracking-tight"
              style={{ fontSize: size === 'sm' ? '11px' : size === 'md' ? '13px' : '16px' }}
            >
              {card.rank}
            </span>
            <span 
              className="leading-none mt-0.5"
              style={{ fontSize: size === 'sm' ? '11px' : size === 'md' ? '14px' : '17px' }}
            >
              {suitSymbol}
            </span>
          </div>

          {/* Center: Number/Rank perfectly aligned middle vertical and horizontal */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span 
              className={cn(
                'font-black tracking-tight leading-none',
                suitColor,
                isKingOfSpades && 'text-amber-600'
              )}
              style={{ 
                fontSize: size === 'sm' ? '22px' : size === 'md' ? '30px' : '40px',
                textShadow: isRed ? '0 1px 2px rgba(239, 68, 68, 0.15)' : '0 1px 2px rgba(15, 23, 42, 0.15)'
              }}
            >
              {card.rank}
            </span>
          </div>

          {/* Bottom-Right: Rank & Suit Icon (rotated 180) */}
          <div className={cn('absolute bottom-1.5 right-1.5 flex flex-col items-center leading-none rotate-180 select-none', suitColor)}>
            <span 
              className="font-black leading-none tracking-tight"
              style={{ fontSize: size === 'sm' ? '11px' : size === 'md' ? '13px' : '16px' }}
            >
              {card.rank}
            </span>
            <span 
              className="leading-none mt-0.5"
              style={{ fontSize: size === 'sm' ? '11px' : size === 'md' ? '14px' : '17px' }}
            >
              {suitSymbol}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
