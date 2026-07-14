import { prisma } from "@/server/db";
import type { MealCategory } from "@prisma/client";

export function findSavedMealsForUser(userId: string) {
  return prisma.savedMeal.findMany({
    where: { userId },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
}

export function createSavedMealFromMeal(userId: string, mealId: string) {
  return prisma.$transaction(async (tx) => {
    const meal = await tx.meal.findFirst({
      where: { id: mealId, userId },
      include: { items: true },
    });
    if (!meal) {
      throw new Error("Meal not found or access denied");
    }

    return tx.savedMeal.create({
      data: {
        userId,
        name: meal.name,
        category: meal.category,
        imageUrl: meal.imageUrl,
        items: {
          create: meal.items.map((item) => ({
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
        },
      },
      include: { items: true },
    });
  });
}

export async function findSavedMealById(userId: string, savedMealId: string) {
  return prisma.savedMeal.findFirst({
    where: { id: savedMealId, userId },
    include: { items: true },
  });
}

export async function deleteSavedMeal(userId: string, savedMealId: string) {
  const savedMeal = await prisma.savedMeal.findFirst({
    where: { id: savedMealId, userId },
  });
  if (!savedMeal) {
    throw new Error("Saved meal not found or access denied");
  }
  return prisma.savedMeal.delete({ where: { id: savedMealId } });
}

export type { MealCategory };
