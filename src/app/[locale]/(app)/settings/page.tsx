import { auth } from "@/server/auth";
import { prisma } from "@/server/db";
import { findProfileByUserId } from "@/server/repositories/profile-repository";
import { SettingsForm } from "@/components/settings/settings-form";

export default async function SettingsPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [user, profile] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    findProfileByUserId(userId),
  ]);

  return (
    <div>
      <h1 className="mb-4 font-heading text-2xl font-bold">Settings</h1>
      <SettingsForm
        email={user!.email}
        name={user!.name ?? ""}
        preferredLocale={user!.preferredLocale === "HE" ? "he" : "en"}
        unitSystem={user!.unitSystem}
        includeActivityCalories={profile!.includeActivityCalories}
        targets={{
          dailyCalorieTarget: profile!.dailyCalorieTarget,
          proteinTargetGrams: profile!.proteinTargetGrams,
          carbohydrateTargetGrams: profile!.carbohydrateTargetGrams,
          fatTargetGrams: profile!.fatTargetGrams,
        }}
      />
    </div>
  );
}
