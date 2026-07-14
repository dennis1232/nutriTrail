import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_FOODS = [
  {
    name: "Chicken breast, grilled",
    caloriesPer100g: 165,
    proteinPer100g: 31,
    carbohydratesPer100g: 0,
    fatPer100g: 3.6,
    servingSizeGrams: 150,
    servingUnit: "piece",
  },
  {
    name: "White rice, cooked",
    caloriesPer100g: 130,
    proteinPer100g: 2.7,
    carbohydratesPer100g: 28,
    fatPer100g: 0.3,
    servingSizeGrams: 158,
    servingUnit: "cup",
  },
  {
    name: "Rolled oats",
    caloriesPer100g: 379,
    proteinPer100g: 13,
    carbohydratesPer100g: 67,
    fatPer100g: 7,
    servingSizeGrams: 40,
    servingUnit: "serving",
  },
  {
    name: "Plain Greek yogurt",
    brand: "Demo Dairy",
    caloriesPer100g: 97,
    proteinPer100g: 9,
    carbohydratesPer100g: 3.6,
    fatPer100g: 5,
    servingSizeGrams: 170,
    servingUnit: "container",
    barcode: "0000000000017",
  },
  {
    name: "Banana",
    caloriesPer100g: 89,
    proteinPer100g: 1.1,
    carbohydratesPer100g: 23,
    fatPer100g: 0.3,
    servingSizeGrams: 118,
    servingUnit: "piece",
  },
  {
    name: "Olive oil",
    caloriesPer100g: 884,
    proteinPer100g: 0,
    carbohydratesPer100g: 0,
    fatPer100g: 100,
    servingSizeGrams: 14,
    servingUnit: "tbsp",
  },
] as const;

async function main() {
  console.log("Seeding demo foods…");
  for (const food of DEMO_FOODS) {
    const existing = await prisma.food.findFirst({
      where: { name: food.name, ownerId: null },
    });
    if (!existing) {
      await prisma.food.create({
        data: { ...food, ownerId: null, source: "SYSTEM", verified: true },
      });
    }
  }

  console.log("Seeding demo account…");
  const demoEmail = "demo@nutritrail.app";
  const passwordHash = await bcrypt.hash("demo1234", 12);

  const demoUser = await prisma.user.upsert({
    where: { email: demoEmail },
    create: {
      email: demoEmail,
      name: "Demo User",
      passwordHash,
      preferredLocale: "EN",
      unitSystem: "METRIC",
    },
    update: {},
  });

  await prisma.userProfile.upsert({
    where: { userId: demoUser.id },
    create: {
      userId: demoUser.id,
      birthDate: new Date("1994-03-10"),
      isAdultConfirmed: true,
      biologicalSex: "UNSPECIFIED",
      heightCm: 175,
      currentWeightKg: 78,
      targetWeightKg: 73,
      activityLevel: "MODERATE",
      nutritionGoal: "LOSE",
      dailyCalorieTarget: 2100,
      proteinTargetGrams: 150,
      carbohydrateTargetGrams: 210,
      fatTargetGrams: 65,
      includeActivityCalories: false,
      onboardingCompletedAt: new Date(),
    },
    update: {},
  });

  const existingMeals = await prisma.meal.count({ where: { userId: demoUser.id } });
  if (existingMeals === 0) {
    const chicken = await prisma.food.findFirst({ where: { name: "Chicken breast, grilled" } });
    const rice = await prisma.food.findFirst({ where: { name: "White rice, cooked" } });
    const oats = await prisma.food.findFirst({ where: { name: "Rolled oats" } });

    const today = new Date();
    today.setHours(8, 0, 0, 0);

    await prisma.meal.create({
      data: {
        userId: demoUser.id,
        name: "Oatmeal breakfast",
        category: "BREAKFAST",
        consumedAt: today,
        sourceType: "MANUAL",
        items: {
          create: [
            {
              foodId: oats?.id,
              displayName: "Rolled oats",
              quantity: 1,
              unit: "serving",
              grams: 40,
              calories: 152,
              protein: 5.2,
              carbohydrates: 27,
              fat: 2.8,
            },
          ],
        },
      },
    });

    const lunchTime = new Date();
    lunchTime.setHours(13, 0, 0, 0);

    await prisma.meal.create({
      data: {
        userId: demoUser.id,
        name: "Chicken and rice",
        category: "LUNCH",
        consumedAt: lunchTime,
        sourceType: "MANUAL",
        items: {
          create: [
            {
              foodId: chicken?.id,
              displayName: "Chicken breast, grilled",
              quantity: 1,
              unit: "piece",
              grams: 150,
              calories: 248,
              protein: 46.5,
              carbohydrates: 0,
              fat: 5.4,
            },
            {
              foodId: rice?.id,
              displayName: "White rice, cooked",
              quantity: 1,
              unit: "cup",
              grams: 158,
              calories: 205,
              protein: 4.3,
              carbohydrates: 44.2,
              fat: 0.5,
            },
          ],
        },
      },
    });

    await prisma.weightEntry.create({
      data: { userId: demoUser.id, weightKg: 78, recordedAt: new Date() },
    });
  }

  console.log(`Demo account ready: ${demoEmail} / demo1234`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
