'use client';

import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface PabloLogoProps extends HTMLMotionProps<'div'> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
  withText?: boolean;
  textSize?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'w-8 h-8 rounded-lg text-lg shadow-sm',
  md: 'w-12 h-12 rounded-xl text-2xl shadow-md',
  lg: 'w-16 h-16 rounded-2xl text-3xl shadow-lg',
  xl: 'w-20 h-20 rounded-2xl text-4xl shadow-lg',
};

const textSizeClasses = {
  sm: 'text-xl',
  md: 'text-2xl',
  lg: 'text-3xl',
  xl: 'text-5xl',
};

export function PabloLogo({
  size = 'xl',
  animated = false,
  withText = false,
  textSize,
  className,
  ...props
}: PabloLogoProps) {
  const chosenTextSize = textSize || size;

  const iconMotionProps = animated
    ? {
        initial: { scale: 0 },
        animate: { scale: 1 },
        transition: { type: 'spring' as const, stiffness: 200, delay: 0.2 },
      }
    : {};

  const logoIcon = (
    <motion.div
      {...iconMotionProps}
      className={cn(
        'inline-flex items-center justify-center font-black text-white select-none',
        'bg-gradient-to-br from-emerald-600 to-emerald-800 shadow-emerald-900/50',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      <span>P</span>
    </motion.div>
  );

  if (!withText) {
    return logoIcon;
  }

  return (
    <div className="flex flex-col items-center">
      {logoIcon}
      <h1 className={cn('font-black text-white tracking-tight mt-4', textSizeClasses[chosenTextSize])}>
        PABL
        <span className="text-emerald-400">O</span>
      </h1>
    </div>
  );
}

export default PabloLogo;
