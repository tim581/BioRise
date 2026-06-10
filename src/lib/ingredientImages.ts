/**
 * Curated, verified ingredient thumbnails via Wikimedia Commons.
 * Only filenames confirmed to resolve are included — wrong names often
 * show unrelated stock photos (e.g. Coconut_milk.jpg = woman drinking).
 */
function commonsThumb(filename: string, width = 240): string {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}?width=${width}`;
}

export const INGREDIENT_THUMBNAILS: Record<number, string> = {
  1: commonsThumb('Various_grains.jpg'),
  2: commonsThumb('Whey_protein.jpg'),
  3: commonsThumb('Milk_powder.jpg'),
  4: commonsThumb('Gelatin.jpg'),
  5: commonsThumb('Chia_seeds.jpg'),
  6: commonsThumb('Flax_seeds.jpg'),
  7: commonsThumb('Almonds.jpg'),
  8: commonsThumb('Walnut.jpg'),
  9: commonsThumb('Cocoa_powder.jpg'),
  10: commonsThumb('Cinnamomum_verum_spices.jpg'),
  11: commonsThumb('Jerusalem_artichoke.jpg'),
  12: commonsThumb('Creatine_monohydrate.jpg'),
  13: commonsThumb('Stevia_rebaudiana.jpg'),
  14: commonsThumb('Salt_shaker_on_white_background.jpg'),
  15: commonsThumb('Curcuma_longa_roots.jpg'),
  16: commonsThumb('Creatine_monohydrate.jpg'),
  17: commonsThumb('Blueberries.jpg'),
  18: commonsThumb('Cherry_Stella444.jpg'),
  19: commonsThumb('Pomegranate.jpg'),
  20: commonsThumb('Hericium_erinaceus.jpg'),
  21: commonsThumb('Chaga_mushroom.jpg'),
  22: commonsThumb('Spinach_leaves.jpg'),
  24: commonsThumb('Green_tea_3_appearances.jpg'),
  25: commonsThumb('Moringa_oleifera.jpg'),
  26: commonsThumb('Spirulina.jpg'),
  27: commonsThumb('Broccoli_and_cross_section_edit.jpg'),
  28: commonsThumb('Baobab_fruit.jpg'),
  29: commonsThumb('Beetroot_jm26647.jpg'),
  30: commonsThumb('Camu_camu.jpg'),
  31: commonsThumb('Withania_somnifera.jpg'),
  32: commonsThumb('Grated_coconut.jpg'),
  33: commonsThumb('Rolled_oats.jpg'),
  34: commonsThumb('Wheat.jpg'),
  35: commonsThumb('Black_pepper.jpg'),
  36: commonsThumb('Capsules.jpg'),
  37: commonsThumb('Capsules.jpg'),
  38: commonsThumb('Capsules.jpg'),
  39: commonsThumb('Capsules.jpg'),
  40: commonsThumb('Kefir.jpg'),
  41: commonsThumb('Vitamin_D3.jpg'),
  42: commonsThumb('Capsules.jpg'),
  43: commonsThumb('Capsules.jpg'),
  44: commonsThumb('Capsules.jpg'),
  46: commonsThumb('Ganoderma_lucidum_01.jpg'),
};

/** Emoji shown when a curated photo is unavailable. */
export const INGREDIENT_EMOJI: Record<number, string> = {
  1: '🌾', 2: '🥛', 3: '🥛', 4: '🦴', 5: '🌰', 6: '🫘', 7: '🌰', 8: '🌰',
  9: '🍫', 10: '🫚', 11: '🌼', 12: '⚡', 13: '🍃', 14: '🧂', 15: '🟡', 16: '💪',
  17: '🫐', 18: '🍒', 19: '🍎', 20: '🍄', 21: '🍄', 22: '🥬', 24: '🍵', 25: '🌿',
  26: '🌊', 27: '🥦', 28: '🌳', 29: '🟣', 30: '🍊', 31: '🌿', 32: '🥥', 33: '🌾',
  34: '🌾', 35: '⚫', 36: '💊', 37: '💊', 38: '💊', 39: '💊', 40: '🦠', 41: '☀️',
  42: '💊', 43: '💊', 44: '💊', 46: '🍄',
};

function isPhotoUrl(value?: string | null): value is string {
  if (!value) return false;
  return value.startsWith('http') || value.startsWith('/');
}

function isEmoji(value?: string | null): boolean {
  if (!value) return false;
  return !isPhotoUrl(value);
}

/** Prefer curated map — DB URLs included many wrong Wikimedia filenames. */
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
