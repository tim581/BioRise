'use client';

import Image from 'next/image';
import { useState } from 'react';
import {
  getIngredientEmojiFallback,
  getIngredientThumbnailUrl,
} from '@/lib/ingredientImages';

type IngredientThumbnailProps = {
  ingredient?: { id?: number; name?: string; image_url?: string | null } | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const SIZES = {
  sm: { box: 'w-10 h-10 rounded-lg text-xl', px: 40 },
  md: { box: 'w-14 h-14 rounded-xl text-2xl', px: 56 },
  lg: { box: 'w-16 h-16 rounded-xl text-3xl', px: 64 },
} as const;

export function IngredientThumbnail({
  ingredient,
  size = 'md',
  className = '',
}: IngredientThumbnailProps) {
  const [failed, setFailed] = useState(false);
  const thumbnailUrl = getIngredientThumbnailUrl(ingredient);
  const emoji = getIngredientEmojiFallback(ingredient);
  const { box, px } = SIZES[size];
  const boxClass = `${box} flex-shrink-0 flex items-center justify-center border border-slate-200 shadow-sm overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 ${className}`;

  if (thumbnailUrl && !failed) {
    return (
      <div className={boxClass} title={ingredient?.name}>
        <Image
          src={thumbnailUrl}
          alt={ingredient?.name ? `${ingredient.name} thumbnail` : 'Ingredient thumbnail'}
          width={px}
          height={px}
          className="w-full h-full object-cover"
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  return (
    <div className={`${boxClass} select-none bg-gradient-to-br from-amber-50 to-orange-50`} title={ingredient?.name}>
      <span className="leading-none">{emoji}</span>
    </div>
  );
}
