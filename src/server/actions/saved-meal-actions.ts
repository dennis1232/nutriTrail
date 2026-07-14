"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/server/auth";
import {
  createSavedMealFromMeal,
  findSavedMealById,
  deleteSavedMeal as deleteSavedMealRepo,
} from "@/server/repositories/saved-meal-repository";
import { createMeal } from "@/server/repositories/meal-repository";
import type { ActionResult } from "@/server/actions/meal-actions";

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHENTICATED");
  return session.user.id;
}

export async function saveMealAsReusable(
  mealId: string,
): Promise<ActionResult<{ savedMealId: string }>> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false, error: "You must be signed in." };
  }

  try {
    const savedMeal = await createSavedMealFromMeal(userId, mealId);
    return { ok: true, data: { savedMealId: savedMeal.id } };
  } catch {
    return { ok: false, error: "Meal not found or you do not have access to it." };
  }
}

export async function addSavedMealToToday(
  savedMealId: string,
): Promise<ActionResult<{ mealId: string }>> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false, error: "You must be signed in." };
  }

  const savedMeal = await findSavedMealById(userId, savedMealId);
  if (!savedMeal) {
    return { ok: false, error: "Saved meal not found or you do not have access to it." };
  }

  const meal = await createMeal({
    userId,
    name: savedMeal.name,
    category: savedMeal.category,
    consumedAt: new Date(),
    imageUrl: savedMeal.imageUrl,
    sourceType: "SAVED_MEAL",
    items: savedMeal.items.map((item) => ({
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

export async function deleteSavedMeal(savedMealId: string): Promise<ActionResult> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false, error: "You must be signed in." };
  }

  try {
    await deleteSavedMealRepo(userId, savedMealId);
  } catch {
    return { ok: false, error: "Saved meal not found or you do not have access to it." };
  }
  return { ok: true, data: undefined };
}
