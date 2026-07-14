/**
 * Pure domain service for nutrition math. Never trusts totals computed on
 * the client — the server always recomputes from food-item-level data.
 * Internal values are kept at full float precision; rounding happens only
 * at the display/service boundary (see `roundForDisplay`).
 */

export type NutrientProfile = {
  calories: number;
  proteinGrams: number;
  carbohydrateGrams: number;
  fatGrams: number;
};

export type FoodPer100g = {
  caloriesPer100g: number;
  proteinPer100g: number;
  carbohydratesPer100g: number;
  fatPer100g: number;
};

/** Common household serving units, approximate grams for liquids/solids is
 * intentionally NOT assumed here — grams must always be supplied explicitly
 * by the caller (derived from the food's own servingSize/servingUnit), since
 * "1 cup" of rice and "1 cup" of oil have very different densities. */
export const SERVING_UNITS = [
  "g",
  "ml",
  "piece",
  "tbsp",
  "tsp",
  "cup",
  "slice",
  "serving",
] as const;
export type ServingUnit = (typeof SERVING_UNITS)[number];

/** Computes the nutrient profile for `grams` of a food defined per 100g. */
export function calculateNutrientsForGrams(
  food: FoodPer100g,
  grams: number,
): NutrientProfile {
  if (grams < 0 || !Number.isFinite(grams)) {
    throw new Error("grams must be a non-negative finite number");
  }

  const factor = grams / 100;
  return {
    calories: food.caloriesPer100g * factor,
    proteinGrams: food.proteinPer100g * factor,
    carbohydrateGrams: food.carbohydratesPer100g * factor,
    fatGrams: food.fatPer100g * factor,
  };
}

/** Sums food-item-level nutrient profiles into a meal or day total. */
export function sumNutrientProfiles(
  items: NutrientProfile[],
): NutrientProfile {
  return items.reduce(
    (total, item) => ({
      calories: total.calories + item.calories,
      proteinGrams: total.proteinGrams + item.proteinGrams,
      carbohydrateGrams: total.carbohydrateGrams + item.carbohydrateGrams,
      fatGrams: total.fatGrams + item.fatGrams,
    }),
    { calories: 0, proteinGrams: 0, carbohydrateGrams: 0, fatGrams: 0 },
  );
}

export function roundForDisplay(profile: NutrientProfile): NutrientProfile {
  return {
    calories: Math.round(profile.calories),
    proteinGrams: Math.round(profile.proteinGrams * 10) / 10,
    carbohydrateGrams: Math.round(profile.carbohydrateGrams * 10) / 10,
    fatGrams: Math.round(profile.fatGrams * 10) / 10,
  };
}

const KCAL_PER_GRAM_PROTEIN = 4;
const KCAL_PER_GRAM_CARB = 4;
const KCAL_PER_GRAM_FAT = 9;

/** Ratio between the stated calories and the macro-derived cross-check
 * calories (protein*4 + carb*4 + fat*9). Values far from 1.0 indicate the
 * source data may be wrong, but per spec we never silently overwrite the
 * stated calories — only flag it for review. */
export function calorieCrossCheckRatio(profile: NutrientProfile): number {
  const derived =
    profile.proteinGrams * KCAL_PER_GRAM_PROTEIN +
    profile.carbohydrateGrams * KCAL_PER_GRAM_CARB +
    profile.fatGrams * KCAL_PER_GRAM_FAT;

  if (profile.calories <= 0) return derived > 0 ? Infinity : 1;
  return derived / profile.calories;
}

const DISCREPANCY_FLAG_THRESHOLD = 0.25;

export function hasLargeCalorieDiscrepancy(profile: NutrientProfile): boolean {
  const ratio = calorieCrossCheckRatio(profile);
  return Math.abs(ratio - 1) > DISCREPANCY_FLAG_THRESHOLD;
}

export function assertNonNegativeNutrients(profile: NutrientProfile): void {
  const values = Object.values(profile);
  if (values.some((value) => !Number.isFinite(value) || value < 0)) {
    throw new Error("Nutrient values must be non-negative finite numbers");
  }
}
