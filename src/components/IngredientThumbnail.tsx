'use client';

import Image from 'next/image';
import { useState } from 'react';
import {
  getIngredientEmojiFallback,
  getIngredientThumbnailUrl,
} from '@/lib/ingredientImages';

type IngredientThumbnailProps = {
  ingredient?: { id?: number; name?: string; image_url?: string | null } | null;
  size?: 'sm' | 'md' | 'lg' | 'card';
  className?: string;
};

const SIZES = {
  sm: { box: 'w-10 h-10 rounded-lg text-xl', px: 40, fill: false },
  md: { box: 'w-14 h-14 rounded-xl text-2xl', px: 56, fill: false },
  lg: { box: 'w-16 h-16 rounded-xl text-3xl', px: 64, fill: false },
  card: {
    box: 'relative w-32 sm:w-40 flex-shrink-0 self-stretch min-h-[9rem] rounded-l-xl overflow-hidden border-r border-slate-200',
    px: 160,
    fill: true,
  },
} as const;

export function IngredientThumbnail({
  ingredient,
  size = 'md',
  className = '',
}: IngredientThumbnailProps) {
  const [failed, setFailed] = useState(false);
  const thumbnailUrl = getIngredientThumbnailUrl(ingredient);
  const emoji = getIngredientEmojiFallback(ingredient);
  const { box, px, fill } = SIZES[size];
  const boxClass = `${box} flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 ${
    size !== 'card' ? 'border border-slate-200 shadow-sm' : ''
  } ${className}`;

  if (thumbnailUrl && !failed) {
    return (
      <div className={boxClass} title={ingredient?.name}>
        {fill ? (
          <Image
            src={thumbnailUrl}
            alt={ingredient?.name ? `${ingredient.name} thumbnail` : 'Ingredient thumbnail'}
            fill
            sizes="160px"
            className="object-cover"
            onError={() => setFailed(true)}
          />
        ) : (
          <Image
            src={thumbnailUrl}
            alt={ingredient?.name ? `${ingredient.name} thumbnail` : 'Ingredient thumbnail'}
            width={px}
            height={px}
            className="w-full h-full object-cover"
            onError={() => setFailed(true)}
          />
        )}
      </div>
    );
  }

  return (
    <div
      className={`${boxClass} select-none bg-gradient-to-br from-amber-50 to-orange-50 ${
        size === 'card' ? 'text-5xl' : ''
      }`}
      title={ingredient?.name}
    >
      <span className="leading-none">{emoji}</span>
    </div>
  );
}
