/**
 * Thumbnail URLs for ingredients via Wikimedia Commons Special:FilePath.
 * Resolves to optimized 120px thumbs; falls back to emoji on load error.
 */
function commonsThumb(filename: string): string {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}?width=120`;
}

export const INGREDIENT_THUMBNAILS: Record<number, string> = {
  1: commonsThumb('Various_grains.jpg'),
  2: commonsThumb('Whey_protein_powder.jpg'),
  3: commonsThumb('Casein_protein_powder.jpg'),
  4: commonsThumb('Collagen_powder.jpg'),
  5: commonsThumb('Chia_seeds.jpg'),
  6: commonsThumb('Flax_seeds.jpg'),
  7: commonsThumb('Almonds_-_in_hand.jpg'),
  8: commonsThumb('Walnuts_-_whole_and_shelled.jpg'),
  9: commonsThumb('Cacao_powder.jpg'),
  10: commonsThumb('Cinnamomum_verum_spices.jpg'),
  11: commonsThumb('Inulin.jpg'),
  12: commonsThumb('Creatine_supplement.jpg'),
  13: commonsThumb('Stevia_rebaudiana_leaves.jpg'),
  14: commonsThumb('Salt_shaker_on_white_background.jpg'),
  15: commonsThumb('Curcuma_longa_roots.jpg'),
  16: commonsThumb('L-Glutamine_powder.jpg'),
  17: commonsThumb('Blueberries.jpg'),
  18: commonsThumb('Cherry_Stella444.jpg'),
  19: commonsThumb('Pomegranate_open.jpg'),
  20: commonsThumb('Hericium_erinaceus_(Yamabushitake),_Sparassidaceae,_Higher_Fungi,_Ypó,_Greece.jpg'),
  21: commonsThumb('Chaga_mushroom.jpg'),
  22: commonsThumb('Spinach_leaves.jpg'),
  24: commonsThumb('Green_tea_3_appearances.jpg'),
  25: commonsThumb('Moringa_oleifera_leaves.jpg'),
  26: commonsThumb('Spirulina_tablets.jpg'),
  27: commonsThumb('Broccoli_and_cross_section_edit.jpg'),
  28: commonsThumb('Baobab_fruit.jpg'),
  29: commonsThumb('Beetroot_jm26647.jpg'),
  30: commonsThumb('Camu-camu_fruit.jpg'),
  31: commonsThumb('Withania_somnifera_(Ashwagandha).jpg'),
  32: commonsThumb('Coconut_milk.jpg'),
  33: commonsThumb('Various_grains.jpg'),
  34: commonsThumb('Wheat_germ.jpg'),
  35: commonsThumb('Black_pepper_(Piper_nigrum).jpg'),
  36: commonsThumb('Pills.jpg'),
  37: commonsThumb('Pills.jpg'),
  38: commonsThumb('Pills.jpg'),
  39: commonsThumb('Pills.jpg'),
  40: commonsThumb('Yogurt_with_probiotic.jpg'),
  41: commonsThumb('Vitamin_D_capsules.jpg'),
  42: commonsThumb('Pills.jpg'),
  43: commonsThumb('Pills.jpg'),
  44: commonsThumb('Pills.jpg'),
  46: commonsThumb('Ganoderma_lucidum_01.jpg'),
};

function isPhotoUrl(value?: string | null): value is string {
  if (!value) return false;
  return value.startsWith('http') || value.startsWith('/');
}

function isEmoji(value?: string | null): boolean {
  if (!value) return false;
  return !isPhotoUrl(value);
}

export function getIngredientThumbnailUrl(
  ingredient?: { id?: number; image_url?: string | null } | null
): string | null {
  if (!ingredient) return null;
  if (isPhotoUrl(ingredient.image_url)) return ingredient.image_url;
  if (ingredient.id && INGREDIENT_THUMBNAILS[ingredient.id]) {
    return INGREDIENT_THUMBNAILS[ingredient.id];
  }
  return null;
}

export function getIngredientEmojiFallback(
  ingredient?: { id?: number; image_url?: string | null } | null
): string {
  if (isEmoji(ingredient?.image_url)) return ingredient!.image_url!;
  return '🌿';
}

export { commonsThumb };
