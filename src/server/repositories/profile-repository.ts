import { prisma } from "@/server/db";
import type {
  ActivityLevel,
  BiologicalSex,
  ImageRetentionPreference,
  NutritionGoal,
} from "@prisma/client";

export function findProfileByUserId(userId: string) {
  return prisma.userProfile.findUnique({ where: { userId } });
}

export type CreateProfileInput = {
  userId: string;
  birthDate: Date | null;
  isAdultConfirmed: boolean;
  biologicalSex: BiologicalSex;
  heightCm: number;
  currentWeightKg: number;
  targetWeightKg: number | null;
  activityLevel: ActivityLevel;
  nutritionGoal: NutritionGoal;
  dailyCalorieTarget: number;
  proteinTargetGrams: number;
  carbohydrateTargetGrams: number;
  fatTargetGrams: number;
  includeActivityCalories: boolean;
};

export function upsertProfile(input: CreateProfileInput) {
  return prisma.userProfile.upsert({
    where: { userId: input.userId },
    create: { ...input, onboardingCompletedAt: new Date() },
    update: { ...input, onboardingCompletedAt: new Date() },
  });
}

export function updateNutritionTargets(
  userId: string,
  targets: {
    dailyCalorieTarget: number;
    proteinTargetGrams: number;
    carbohydrateTargetGrams: number;
    fatTargetGrams: number;
  },
) {
  return prisma.userProfile.update({
    where: { userId },
    data: targets,
  });
}

export function updateImageRetention(
  userId: string,
  imageRetention: ImageRetentionPreference,
) {
  return prisma.userProfile.update({
    where: { userId },
    data: { imageRetention },
  });
}
