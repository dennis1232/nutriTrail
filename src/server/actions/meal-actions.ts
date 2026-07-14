"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/server/auth";
import {
  createMealSchema,
  createCustomFoodSchema,
  weightEntrySchema,
  activityEntrySchema,
  type CreateMealInput,
} from "@/server/validation/meal";
import {
  createMeal,
  deleteMeal as deleteMealRepo,
  findMealById,
  createWeightEntry,
  createActivityEntry,
} from "@/server/repositories/meal-repository";
import {
  createFood,
  addFavoriteFood,
  removeFavoriteFood,
} from "@/server/repositories/food-repository";
import {
  assertNonNegativeNutrients,
  hasLargeCalorieDiscrepancy,
} from "@/server/services/nutrition-calculation-service";

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user) {
    throw new Error("UNAUTHENTICATED");
  }
  return session.user.id;
}

export async function saveMeal(
  input: unknown,
): Promise<ActionResult<{ mealId: string; flaggedItems: string[] }>> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false, error: "You must be signed in." };
  }

  const parsed = createMealSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const data: CreateMealInput = parsed.data;
  const flaggedItems: string[] = [];

  for (const item of data.items) {
    const profile = {
      calories: item.calories,
      proteinGrams: item.protein,
      carbohydrateGrams: item.carbohydrates,
      fatGrams: item.fat,
    };
    assertNonNegativeNutrients(profile);
    if (hasLargeCalorieDiscrepancy(profile)) {
      flaggedItems.push(item.displayName);
    }
  }

  const meal = await createMeal({
    userId,
    name: data.name,
    category: data.category,
    consumedAt: new Date(data.consumedAt),
    imageUrl: data.imageUrl ?? null,
    notes: data.notes ?? null,
    sourceType: data.sourceType,
    aiAnalysisId: data.aiAnalysisId ?? null,
    items: data.items.map((item) => ({
      foodId: item.foodId ?? null,
      displayName: item.displayName,
      quantity: item.quantity,
      unit: item.unit,
      grams: item.grams,
      calories: item.calories,
      protein: item.protein,
      carbohydrates: item.carbohydrates,
      fat: item.fat,
      aiConfidence: item.aiConfidence ?? null,
      aiAssumptions: item.aiAssumptions ?? [],
    })),
  });

  revalidatePath("/[locale]/(app)/today", "page");

  return { ok: true, data: { mealId: meal.id, flaggedItems } };
}

export async function deleteMeal(mealId: string): Promise<ActionResult> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false, error: "You must be signed in." };
  }

  try {
    await deleteMealRepo(userId, mealId);
  } catch {
    return { ok: false, error: "Meal not found or you do not have access to it." };
  }

  revalidatePath("/[locale]/(app)/today", "page");
  return { ok: true, data: undefined };
}

export async function duplicateMealToToday(
  mealId: string,
): Promise<ActionResult<{ mealId: string }>> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false, error: "You must be signed in." };
  }

  const original = await findMealById(userId, mealId);
  if (!original) {
    return { ok: false, error: "Meal not found or you do not have access to it." };
  }

  const meal = await createMeal({
    userId,
    name: original.name,
    category: original.category,
    consumedAt: new Date(),
    imageUrl: original.imageUrl,
    notes: original.notes,
    sourceType: "COPIED",
    items: original.items.map((item) => ({
      foodId: item.foodId,
      displayName: item.displayName,
      quantity: item.quantity,
      unit: item.unit,
      grams: item.grams,
      calories: item.calories,
      protein: item.protein,
      carbohydrates: item.carbohydrates,
      fat: item.fat,
    })),
  });

  revalidatePath("/[locale]/(app)/today", "page");
  return { ok: true, data: { mealId: meal.id } };
}

export async function createCustomFood(
  input: unknown,
): Promise<ActionResult<{ foodId: string }>> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false, error: "You must be signed in." };
  }

  const parsed = createCustomFoodSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const food = await createFood({
    ownerId: userId,
    source: "USER",
    verified: false,
    ...parsed.data,
  });

  return { ok: true, data: { foodId: food.id } };
}

export async function toggleFavoriteFood(
  foodId: string,
  isFavorite: boolean,
): Promise<ActionResult> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false, error: "You must be signed in." };
  }

  if (isFavorite) {
    await addFavoriteFood(userId, foodId);
  } else {
    await removeFavoriteFood(userId, foodId);
  }
  return { ok: true, data: undefined };
}

export async function addWeightEntry(input: unknown): Promise<ActionResult> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false, error: "You must be signed in." };
  }

  const parsed = weightEntrySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await createWeightEntry({
    userId,
    weightKg: parsed.data.weightKg,
    recordedAt: new Date(parsed.data.recordedAt),
    notes: parsed.data.notes ?? null,
  });

  revalidatePath("/[locale]/(app)/progress", "page");
  return { ok: true, data: undefined };
}

export async function addActivityEntry(input: unknown): Promise<ActionResult> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false, error: "You must be signed in." };
  }

  const parsed = activityEntrySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await createActivityEntry({
    userId,
    name: parsed.data.name,
    durationMinutes: parsed.data.durationMinutes,
    caloriesBurned: parsed.data.caloriesBurned,
    performedAt: new Date(parsed.data.performedAt),
  });

  revalidatePath("/[locale]/(app)/today", "page");
  return { ok: true, data: undefined };
}
