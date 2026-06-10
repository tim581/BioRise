/**
 * Ingredient thumbnails — raw / whole-food sources only.
 * Processed forms (protein tubs, capsules, grated product, salt shakers)
 * are avoided; isolates show their natural source food where possible.
 */
function commonsThumb(filename: string, width = 240): string {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}?width=${width}`;
}

export const INGREDIENT_THUMBNAILS: Record<number, string> = {
  // Real food & grains
  1: commonsThumb('Oat_grains.jpg'),
  33: commonsThumb('Oat_grains.jpg'),
  34: commonsThumb('Wheat.jpg'),
  5: commonsThumb('Chia_seeds.jpg'),
  6: commonsThumb('Flax_seeds.jpg'),
  7: commonsThumb('Almonds.jpg'),
  8: commonsThumb('Walnuts.jpg'),
  9: commonsThumb('Cocoa_beans.jpg'),
  10: commonsThumb('Cinnamon_sticks.jpg'),
  14: commonsThumb('Halite.jpg'),
  15: commonsThumb('Curcuma_longa_roots.jpg'),
  17: commonsThumb('Blueberries.jpg'),
  18: commonsThumb('Cherry_Stella444.jpg'),
  19: commonsThumb('Pomegranate.jpg'),
  22: commonsThumb('Spinach_leaves.jpg'),
  27: commonsThumb('Broccoli_and_cross_section_edit.jpg'),
  28: commonsThumb('Baobab_fruit.jpg'),
  29: commonsThumb('Beetroot_jm26647.jpg'),
  32: commonsThumb('Coconut.jpg'),
  35: commonsThumb('Black_pepper.jpg'),

  // Proteins — show animal/plant source, not powder
  2: commonsThumb('Milk_glass.jpg'),
  3: commonsThumb('Milk_glass.jpg'),
  4: commonsThumb('Beef_bones.jpg'),
  12: commonsThumb('Raw_tuna.jpg'),
  16: commonsThumb('Eggs.jpg'),

  // Bioactives & botanicals
  11: commonsThumb('Jerusalem_artichoke.jpg'),
  13: commonsThumb('Stevia_rebaudiana.jpg'),
  20: commonsThumb('Hericium_erinaceus.jpg'),
  21: commonsThumb('Chaga_mushroom.jpg'),
  24: commonsThumb('Matcha_tea.jpg'),
  25: commonsThumb('Moringa_oleifera.jpg'),
  26: commonsThumb('Spirulina.jpg'),
  30: commonsThumb('Camu_camu.jpg'),
  31: commonsThumb('Withania_somnifera.jpg'),
  46: commonsThumb('Ganoderma_lucidum_01.jpg'),

  // Minerals & vitamins — whole foods rich in the nutrient
  36: commonsThumb('Pumpkin_seeds.jpg'),
  37: commonsThumb('Pumpkin_seeds.jpg'),
  38: commonsThumb('Apples.jpg'),
  39: commonsThumb('Banana.jpg'),
  40: commonsThumb('Yogurt.jpg'),
  41: commonsThumb('Egg_yolk.jpg'),
  42: commonsThumb('Egg_yolk.jpg'),
  43: commonsThumb('Brazil_nuts.jpg'),
  44: commonsThumb('Brazil_nuts.jpg'),
};

/** Emoji fallback when no suitable raw-food photo exists. */
export const INGREDIENT_EMOJI: Record<number, string> = {
  1: '🌾', 2: '🥛', 3: '🥛', 4: '🦴', 5: '🌰', 6: '🫘', 7: '🌰', 8: '🌰',
  9: '🫘', 10: '🫚', 11: '🌼', 12: '🐟', 13: '🍃', 14: '🧂', 15: '🟡', 16: '🥚',
  17: '🫐', 18: '🍒', 19: '🍎', 20: '🍄', 21: '🍄', 22: '🥬', 24: '🍵', 25: '🌿',
  26: '🌊', 27: '🥦', 28: '🌳', 29: '🟣', 30: '🍊', 31: '🌿', 32: '🥥', 33: '🌾',
  34: '🌾', 35: '⚫', 36: '🎃', 37: '🎃', 38: '🍎', 39: '🍌', 40: '🥛', 41: '🥚',
  42: '🥚', 43: '🌰', 44: '🌰', 46: '🍄',
};

function isPhotoUrl(value?: string | null): value is string {
  if (!value) return false;
  return value.startsWith('http') || value.startsWith('/');
}

function isEmoji(value?: string | null): boolean {
  if (!value) return false;
  return !isPhotoUrl(value);
}

/** Prefer curated raw-food map over DB URLs. */
export function getIngredientThumbnailUrl(
  ingredient?: { id?: number; image_url?: string | null } | null
): string | null {
  if (!ingredient?.id) return null;
  if (INGREDIENT_THUMBNAILS[ingredient.id]) {
    return INGREDIENT_THUMBNAILS[ingredient.id];
  }
  if (isPhotoUrl(ingredient.image_url)) return ingredient.image_url;
  return null;
}

export function getIngredientEmojiFallback(
  ingredient?: { id?: number; image_url?: string | null } | null
): string {
  if (ingredient?.id && INGREDIENT_EMOJI[ingredient.id]) {
    return INGREDIENT_EMOJI[ingredient.id];
  }
  if (isEmoji(ingredient?.image_url)) return ingredient!.image_url!;
  return '🌿';
}

export { commonsThumb };
