import { prisma } from "@/server/db";
import type { MealCategory, MealSourceType } from "@prisma/client";

export type MealItemInput = {
  foodId?: string | null;
  displayName: string;
  quantity: number;
  unit: string;
  grams: number;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  aiConfidence?: number | null;
  aiAssumptions?: string[];
};

export type CreateMealInput = {
  userId: string;
  name: string;
  category: MealCategory;
  consumedAt: Date;
  imageUrl?: string | null;
  notes?: string | null;
  sourceType: MealSourceType;
  aiAnalysisId?: string | null;
  items: MealItemInput[];
};

export function createMeal(input: CreateMealInput) {
  const { items, ...meal } = input;
  return prisma.meal.create({
    data: {
      ...meal,
      items: { create: items },
    },
    include: { items: true },
  });
}

export function findMealById(userId: string, mealId: string) {
  return prisma.meal.findFirst({
    where: { id: mealId, userId },
    include: { items: { include: { food: true } } },
  });
}

export function findMealsForDay(userId: string, dayStart: Date, dayEnd: Date) {
  return prisma.meal.findMany({
    where: { userId, consumedAt: { gte: dayStart, lt: dayEnd } },
    include: { items: true },
    orderBy: { consumedAt: "asc" },
  });
}

export function findRecentMeals(userId: string, take = 10) {
  return prisma.meal.findMany({
    where: { userId },
    include: { items: true },
    orderBy: { consumedAt: "desc" },
    take,
  });
}

export async function updateMealItems(
  userId: string,
  mealId: string,
  fields: {
    name?: string;
    category?: MealCategory;
    consumedAt?: Date;
    notes?: string | null;
  },
  items?: MealItemInput[],
) {
  const meal = await prisma.meal.findFirst({ where: { id: mealId, userId } });
  if (!meal) {
    throw new Error("Meal not found or access denied");
  }

  return prisma.$transaction(async (tx) => {
    if (items) {
      await tx.mealItem.deleteMany({ where: { mealId } });
    }
    return tx.meal.update({
      where: { id: mealId },
      data: {
        ...fields,
        ...(items ? { items: { create: items } } : {}),
      },
      include: { items: true },
    });
  });
}

export async function deleteMeal(userId: string, mealId: string) {
  const meal = await prisma.meal.findFirst({ where: { id: mealId, userId } });
  if (!meal) {
    throw new Error("Meal not found or access denied");
  }
  return prisma.meal.delete({ where: { id: mealId } });
}

export function findWeightEntries(userId: string, take = 90) {
  return prisma.weightEntry.findMany({
    where: { userId },
    orderBy: { recordedAt: "desc" },
    take,
  });
}

export function createWeightEntry(input: {
  userId: string;
  weightKg: number;
  recordedAt: Date;
  notes?: string | null;
}) {
  return prisma.weightEntry.create({ data: input });
}

export function createActivityEntry(input: {
  userId: string;
  name: string;
  durationMinutes: number;
  caloriesBurned: number;
  performedAt: Date;
}) {
  return prisma.activityEntry.create({ data: input });
}

export function findActivityEntriesForDay(
  userId: string,
  dayStart: Date,
  dayEnd: Date,
) {
  return prisma.activityEntry.findMany({
    where: { userId, performedAt: { gte: dayStart, lt: dayEnd } },
    orderBy: { performedAt: "asc" },
  });
}
