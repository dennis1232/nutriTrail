import { prisma } from "@/server/db";
import type { FoodSource } from "@prisma/client";

export function searchFoods(userId: string, query: string, take = 20) {
  return prisma.food.findMany({
    where: {
      AND: [
        { OR: [{ ownerId: null }, { ownerId: userId }] },
        query
          ? {
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { brand: { contains: query, mode: "insensitive" } },
              ],
            }
          : {},
      ],
    },
    orderBy: { name: "asc" },
    take,
  });
}

export function findFoodByBarcode(barcode: string) {
  return prisma.food.findFirst({ where: { barcode } });
}

export function findFoodById(id: string) {
  return prisma.food.findUnique({ where: { id } });
}

export type CreateFoodInput = {
  ownerId: string | null;
  name: string;
  brand?: string | null;
  barcode?: string | null;
  source: FoodSource;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbohydratesPer100g: number;
  fatPer100g: number;
  fiberPer100g?: number | null;
  servingSizeGrams?: number | null;
  servingUnit?: string | null;
  verified?: boolean;
};

export function createFood(input: CreateFoodInput) {
  return prisma.food.create({ data: input });
}

export function getRecentFoodsForUser(userId: string, take = 10) {
  return prisma.mealItem
    .findMany({
      where: { meal: { userId }, foodId: { not: null } },
      distinct: ["foodId"],
      orderBy: { createdAt: "desc" },
      take,
      include: { food: true },
    })
    .then((items) => items.map((item) => item.food).filter((food) => food !== null));
}

export function getFavoriteFoodsForUser(userId: string) {
  return prisma.userFavoriteFood.findMany({
    where: { userId },
    include: { food: true },
    orderBy: { createdAt: "desc" },
  });
}

export function addFavoriteFood(userId: string, foodId: string) {
  return prisma.userFavoriteFood.upsert({
    where: { userId_foodId: { userId, foodId } },
    create: { userId, foodId },
    update: {},
  });
}

export function removeFavoriteFood(userId: string, foodId: string) {
  return prisma.userFavoriteFood.delete({
    where: { userId_foodId: { userId, foodId } },
  });
}
