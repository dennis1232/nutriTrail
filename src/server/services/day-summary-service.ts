import {
  roundForDisplay,
  sumNutrientProfiles,
  type NutrientProfile,
} from "@/server/services/nutrition-calculation-service";

export type MealCategory = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";

export type DaySummaryMealItem = {
  id: string;
  displayName: string;
  quantity: number;
  unit: string;
  grams: number;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  aiConfidence: number | null;
};

export type DaySummaryMeal = {
  id: string;
  name: string;
  category: MealCategory;
  consumedAt: Date;
  imageUrl: string | null;
  items: DaySummaryMealItem[];
};

export type DaySummaryTargets = {
  dailyCalorieTarget: number;
  proteinTargetGrams: number;
  carbohydrateTargetGrams: number;
  fatTargetGrams: number;
  includeActivityCalories: boolean;
};

export type DaySummary = {
  totals: NutrientProfile;
  caloriesRemaining: number;
  activityCaloriesBurned: number;
  mealsByCategory: Record<MealCategory, DaySummaryMeal[]>;
};

function mealToNutrientProfile(meal: DaySummaryMeal): NutrientProfile {
  return sumNutrientProfiles(
    meal.items.map((item) => ({
      calories: item.calories,
      proteinGrams: item.protein,
      carbohydrateGrams: item.carbohydrates,
      fatGrams: item.fat,
    })),
  );
}

export function buildDaySummary(
  meals: DaySummaryMeal[],
  activityCaloriesBurned: number,
  targets: DaySummaryTargets,
): DaySummary {
  const totals = roundForDisplay(
    sumNutrientProfiles(meals.map(mealToNutrientProfile)),
  );

  const budget = targets.includeActivityCalories
    ? targets.dailyCalorieTarget + activityCaloriesBurned
    : targets.dailyCalorieTarget;

  const mealsByCategory: Record<MealCategory, DaySummaryMeal[]> = {
    BREAKFAST: [],
    LUNCH: [],
    DINNER: [],
    SNACK: [],
  };
  for (const meal of meals) {
    mealsByCategory[meal.category].push(meal);
  }

  return {
    totals,
    caloriesRemaining: Math.round(budget - totals.calories),
    activityCaloriesBurned,
    mealsByCategory,
  };
}
