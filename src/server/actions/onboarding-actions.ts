"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/server/auth";
import { prisma } from "@/server/db";
import { onboardingSchema } from "@/server/validation/onboarding";
import { upsertProfile } from "@/server/repositories/profile-repository";

export type CompleteOnboardingResult =
  | { ok: true }
  | { ok: false; error: string };

export async function completeOnboarding(
  input: unknown,
): Promise<CompleteOnboardingResult> {
  const session = await auth();
  if (!session?.user) {
    return { ok: false, error: "You must be signed in." };
  }

  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const data = parsed.data;

  // A JWT session can outlive its user row (account deleted, database
  // reset). Fail with a clear message instead of a Prisma P2025 crash.
  const existingUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true },
  });
  if (!existingUser) {
    return {
      ok: false,
      error:
        "Your login session is no longer valid. Please log out and sign in or register again.",
    };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: data.displayName,
      preferredLocale: data.preferredLocale === "he" ? "HE" : "EN",
      unitSystem: data.unitSystem,
    },
  });

  await upsertProfile({
    userId: session.user.id,
    birthDate: new Date(data.birthDate),
    isAdultConfirmed: true,
    biologicalSex: data.biologicalSex,
    heightCm: data.heightCm,
    currentWeightKg: data.currentWeightKg,
    targetWeightKg: data.targetWeightKg ?? null,
    activityLevel: data.activityLevel,
    nutritionGoal: data.nutritionGoal,
    dailyCalorieTarget: data.dailyCalorieTarget,
    proteinTargetGrams: data.proteinTargetGrams,
    carbohydrateTargetGrams: data.carbohydrateTargetGrams,
    fatTargetGrams: data.fatTargetGrams,
    includeActivityCalories: false,
  });

  revalidatePath("/", "layout");

  return { ok: true };
}
