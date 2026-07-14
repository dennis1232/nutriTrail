/**
 * Pure domain service: no Prisma/Next.js imports, safe to lift into a
 * standalone backend later. All estimates are conservative by design —
 * the spec explicitly forbids extreme deficits/surpluses.
 */

export type BiologicalSex = "MALE" | "FEMALE" | "UNSPECIFIED";
export type ActivityLevel =
  | "SEDENTARY"
  | "LIGHT"
  | "MODERATE"
  | "ACTIVE"
  | "VERY_ACTIVE";
export type NutritionGoal = "MAINTAIN" | "LOSE" | "GAIN";

export type CalorieTargetInput = {
  sex: BiologicalSex;
  ageYears: number;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: NutritionGoal;
};

export type MacroTargets = {
  proteinGrams: number;
  carbohydrateGrams: number;
  fatGrams: number;
};

export type CalorieTargetResult = {
  bmr: number;
  maintenanceCalories: number;
  dailyCalorieTarget: number;
  macros: MacroTargets;
};

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  SEDENTARY: 1.2,
  LIGHT: 1.375,
  MODERATE: 1.55,
  ACTIVE: 1.725,
  VERY_ACTIVE: 1.9,
};

// Conservative, non-aggressive adjustments per spec ("do not create extreme
// calorie deficits or aggressive recommendations"). Roughly 0.4-0.5 kg/week.
const GOAL_ADJUSTMENT_KCAL: Record<NutritionGoal, number> = {
  MAINTAIN: 0,
  LOSE: -450,
  GAIN: 300,
};

// Never suggest below this floor regardless of inputs — protects against
// unrealistically low, unsafe targets.
const MINIMUM_SAFE_CALORIES = 1200;

/** Mifflin-St Jeor equation. Sex-neutral average used when unspecified. */
function calculateBmr(input: CalorieTargetInput): number {
  const base = 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.ageYears;

  if (input.sex === "MALE") return base + 5;
  if (input.sex === "FEMALE") return base - 161;
  // Unspecified: average of the male/female offsets (+5 and -161 -> -78).
  return base - 78;
}

export function calculateCalorieTarget(
  input: CalorieTargetInput,
): CalorieTargetResult {
  const bmr = Math.round(calculateBmr(input));
  const maintenanceCalories = Math.round(
    bmr * ACTIVITY_MULTIPLIERS[input.activityLevel],
  );

  const adjusted = maintenanceCalories + GOAL_ADJUSTMENT_KCAL[input.goal];
  const dailyCalorieTarget = Math.max(MINIMUM_SAFE_CALORIES, Math.round(adjusted));

  return {
    bmr,
    maintenanceCalories,
    dailyCalorieTarget,
    macros: calculateDefaultMacros(dailyCalorieTarget, input.goal),
  };
}

/**
 * Default macro split, grams derived from the calorie target using the
 * standard 4/4/9 kcal-per-gram cross-check. Protein is weighted higher for
 * a "lose" goal to help preserve lean mass; these are starting points the
 * user can always override.
 */
export function calculateDefaultMacros(
  dailyCalorieTarget: number,
  goal: NutritionGoal,
): MacroTargets {
  const proteinRatio = goal === "LOSE" ? 0.3 : goal === "GAIN" ? 0.25 : 0.25;
  const fatRatio = 0.3;
  const carbRatio = 1 - proteinRatio - fatRatio;

  return {
    proteinGrams: Math.round((dailyCalorieTarget * proteinRatio) / 4),
    carbohydrateGrams: Math.round((dailyCalorieTarget * carbRatio) / 4),
    fatGrams: Math.round((dailyCalorieTarget * fatRatio) / 9),
  };
}

export function calculateAgeYears(birthDate: Date, now: Date = new Date()): number {
  let age = now.getFullYear() - birthDate.getFullYear();
  const hasHadBirthdayThisYear =
    now.getMonth() > birthDate.getMonth() ||
    (now.getMonth() === birthDate.getMonth() && now.getDate() >= birthDate.getDate());
  if (!hasHadBirthdayThisYear) age -= 1;
  return age;
}
