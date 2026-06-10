'use client';

import Image from 'next/image';
import { useState } from 'react';
import {
  getIngredientEmojiFallback,
  getIngredientThumbnailUrl,
} from '@/lib/ingredientImages';

type IngredientThumbnailProps = {
  ingredient?: { id?: number; name?: string; image_url?: string | null } | null;
  size?: 'sm' | 'md';
  className?: string;
};

const SIZE_CLASSES = {
  sm: 'w-8 h-8 rounded-lg text-lg',
  md: 'w-10 h-10 rounded-xl text-2xl',
} as const;

export function IngredientThumbnail({
  ingredient,
  size = 'md',
  className = '',
}: IngredientThumbnailProps) {
  const [failed, setFailed] = useState(false);
  const thumbnailUrl = getIngredientThumbnailUrl(ingredient);
  const emoji = getIngredientEmojiFallback(ingredient);
  const sizeClass = SIZE_CLASSES[size];
  const boxClass = `${sizeClass} flex-shrink-0 flex items-center justify-center border border-slate-200 shadow-sm overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 ${className}`;

  if (thumbnailUrl && !failed) {
    return (
      <div className={boxClass} title={ingredient?.name}>
        <Image
          src={thumbnailUrl}
          alt={ingredient?.name ? `${ingredient.name} thumbnail` : 'Ingredient thumbnail'}
          width={size === 'sm' ? 32 : 40}
          height={size === 'sm' ? 32 : 40}
          className="w-full h-full object-cover"
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  return (
    <div className={`${boxClass} select-none`} title={ingredient?.name}>
      {emoji}
    </div>
  );
}
