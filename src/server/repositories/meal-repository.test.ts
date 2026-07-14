import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/server/db";
import {
  createMeal,
  deleteMeal,
  findMealById,
  updateMealItems,
} from "./meal-repository";

const suffix = Date.now();
const userAEmail = `repo-test-a-${suffix}@example.com`;
const userBEmail = `repo-test-b-${suffix}@example.com`;

let userAId: string;
let userBId: string;

beforeAll(async () => {
  const [userA, userB] = await Promise.all([
    prisma.user.create({ data: { email: userAEmail, name: "User A" } }),
    prisma.user.create({ data: { email: userBEmail, name: "User B" } }),
  ]);
  userAId = userA.id;
  userBId = userB.id;
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { id: { in: [userAId, userBId] } } });
  await prisma.$disconnect();
});

describe("meal repository ownership", () => {
  it("does not return another user's meal by id", async () => {
    const meal = await createMeal({
      userId: userAId,
      name: "User A's lunch",
      category: "LUNCH",
      consumedAt: new Date(),
      sourceType: "MANUAL",
      items: [
        {
          displayName: "Rice",
          quantity: 1,
          unit: "cup",
          grams: 150,
          calories: 200,
          protein: 4,
          carbohydrates: 44,
          fat: 0.4,
        },
      ],
    });

    const foundByOwner = await findMealById(userAId, meal.id);
    expect(foundByOwner?.id).toBe(meal.id);

    const foundByOtherUser = await findMealById(userBId, meal.id);
    expect(foundByOtherUser).toBeNull();
  });

  it("refuses to update a meal owned by a different user", async () => {
    const meal = await createMeal({
      userId: userAId,
      name: "User A's dinner",
      category: "DINNER",
      consumedAt: new Date(),
      sourceType: "MANUAL",
      items: [
        {
          displayName: "Chicken",
          quantity: 1,
          unit: "piece",
          grams: 150,
          calories: 250,
          protein: 45,
          carbohydrates: 0,
          fat: 6,
        },
      ],
    });

    await expect(
      updateMealItems(userBId, meal.id, { name: "Hijacked name" }),
    ).rejects.toThrow(/not found|access denied/i);

    const unchanged = await findMealById(userAId, meal.id);
    expect(unchanged?.name).toBe("User A's dinner");
  });

  it("refuses to delete a meal owned by a different user", async () => {
    const meal = await createMeal({
      userId: userAId,
      name: "User A's snack",
      category: "SNACK",
      consumedAt: new Date(),
      sourceType: "MANUAL",
      items: [
        {
          displayName: "Apple",
          quantity: 1,
          unit: "piece",
          grams: 180,
          calories: 94,
          protein: 0.5,
          carbohydrates: 25,
          fat: 0.3,
        },
      ],
    });

    await expect(deleteMeal(userBId, meal.id)).rejects.toThrow(/not found|access denied/i);

    const stillThere = await findMealById(userAId, meal.id);
    expect(stillThere).not.toBeNull();

    await deleteMeal(userAId, meal.id);
  });
});
