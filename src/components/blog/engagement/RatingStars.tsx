'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { clsx } from 'clsx';
import type { BlogRatingValue } from '@/types/blog-engagement.types';

interface RatingStarsProps {
  value: number;
  size?: number;
  /** When true, renders as interactive selectable stars (1–5). */
  interactive?: boolean;
  onChange?: (value: BlogRatingValue) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Star rating display / selector. Renders filled/half/empty stars based on
 * `value`, or an interactive 1–5 selector when `interactive` is set.
 */
export function RatingStars({
  value,
  size = 18,
  interactive = false,
  onChange,
  disabled = false,
  className,
}: RatingStarsProps) {
  const [hover, setHover] = useState<number | null>(null);

  if (!interactive) {
    return (
      <span
        className={clsx('inline-flex items-center gap-0.5', className)}
        aria-label={`${value.toFixed(1)} out of 5 stars`}
      >
        {[1, 2, 3, 4, 5].map((i) => {
          const filled = value >= i - 0.25;
          const half = !filled && value >= i - 0.75;
          return (
            <Star
              key={i}
              size={size}
              className={clsx(
                'shrink-0',
                filled ? 'fill-amber-400 text-amber-400' : 'text-gray-300',
                half && 'text-amber-400'
              )}
            />
          );
        })}
      </span>
    );
  }

  const active = hover ?? Math.round(value);

  return (
    <span
      className={clsx('inline-flex items-center gap-1', className)}
      role="radiogroup"
      aria-label="Rate this article"
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={Math.round(value) === i}
          aria-label={`${i} star${i > 1 ? 's' : ''}`}
          disabled={disabled}
          onClick={() => onChange?.(i as BlogRatingValue)}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(null)}
          className={clsx(
            'rounded p-0.5 transition-transform',
            disabled ? 'cursor-not-allowed opacity-50' : 'hover:scale-110',
            i <= active ? 'fill-amber-400 text-amber-400' : 'fill-none text-gray-300'
          )}
        >
          <Star size={size} />
        </button>
      ))}
    </span>
  );
}
