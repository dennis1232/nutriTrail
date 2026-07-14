"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/server/auth";
import { prisma } from "@/server/db";
import {
  updateNutritionTargets,
  updateImageRetention,
} from "@/server/repositories/profile-repository";
import type { ActionResult } from "@/server/actions/meal-actions";

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHENTICATED");
  return session.user.id;
}

export async function updateTargetsAction(input: {
  dailyCalorieTarget: number;
  proteinTargetGrams: number;
  carbohydrateTargetGrams: number;
  fatTargetGrams: number;
}): Promise<ActionResult> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false, error: "You must be signed in." };
  }

  if (
    input.dailyCalorieTarget < 1200 ||
    input.dailyCalorieTarget > 6000 ||
    [input.proteinTargetGrams, input.carbohydrateTargetGrams, input.fatTargetGrams].some(
      (v) => v < 0,
    )
  ) {
    return { ok: false, error: "Values out of range." };
  }

  await updateNutritionTargets(userId, input);
  revalidatePath("/[locale]/(app)/today", "page");
  return { ok: true, data: undefined };
}

export async function updatePreferencesAction(input: {
  preferredLocale: "en" | "he";
  unitSystem: "METRIC" | "IMPERIAL";
  includeActivityCalories: boolean;
}): Promise<ActionResult> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false, error: "You must be signed in." };
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      preferredLocale: input.preferredLocale === "he" ? "HE" : "EN",
      unitSystem: input.unitSystem,
    },
  });
  await prisma.userProfile.update({
    where: { userId },
    data: { includeActivityCalories: input.includeActivityCalories },
  });

  revalidatePath("/[locale]/(app)/today", "page");
  return { ok: true, data: undefined };
}

export async function updateImageRetentionAction(
  value: "KEEP" | "DELETE_AFTER_30_DAYS" | "DELETE_IMMEDIATELY",
): Promise<ActionResult> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false, error: "You must be signed in." };
  }
  await updateImageRetention(userId, value);
  return { ok: true, data: undefined };
}

export async function exportUserDataAction(): Promise<ActionResult<string>> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false, error: "You must be signed in." };
  }

  const [user, profile, meals, weightEntries, activityEntries] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.userProfile.findUnique({ where: { userId } }),
    prisma.meal.findMany({ where: { userId }, include: { items: true } }),
    prisma.weightEntry.findMany({ where: { userId } }),
    prisma.activityEntry.findMany({ where: { userId } }),
  ]);

  const exportPayload = {
    exportedAt: new Date().toISOString(),
    user: user ? { email: user.email, name: user.name } : null,
    profile,
    meals,
    weightEntries,
    activityEntries,
  };

  return { ok: true, data: JSON.stringify(exportPayload, null, 2) };
}

export async function deleteAccountAction(): Promise<ActionResult> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false, error: "You must be signed in." };
  }

  await prisma.user.delete({ where: { id: userId } });
  return { ok: true, data: undefined };
}
