import { auth } from "@/server/auth";
import { findProfileByUserId } from "@/server/repositories/profile-repository";
import { findWeightEntries } from "@/server/repositories/meal-repository";
import { WeightChart } from "@/components/progress/weight-chart";
import { WeightEntryForm } from "@/components/progress/weight-entry-form";
import { ActivityEntryForm } from "@/components/progress/activity-entry-form";

export default async function ProgressPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [profile, weightEntries] = await Promise.all([
    findProfileByUserId(userId),
    findWeightEntries(userId, 90),
  ]);

  const chartEntries = [...weightEntries]
    .reverse()
    .map((entry) => ({
      date: new Date(entry.recordedAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      weightKg: entry.weightKg,
    }));

  const currentWeight = weightEntries[0]?.weightKg ?? profile?.currentWeightKg;
  const startingWeight =
    weightEntries[weightEntries.length - 1]?.weightKg ?? profile?.currentWeightKg;

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Progress</h1>

      <div className="grid grid-cols-3 gap-3 rounded-2xl border border-zinc-200 bg-white p-4 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div>
          <p className="text-xs text-zinc-500">Starting</p>
          <p className="text-lg font-semibold">{startingWeight ?? "—"} kg</p>
        </div>
        <div>
          <p className="text-xs text-zinc-500">Current</p>
          <p className="text-lg font-semibold">{currentWeight ?? "—"} kg</p>
        </div>
        <div>
          <p className="text-xs text-zinc-500">Target</p>
          <p className="text-lg font-semibold">
            {profile?.targetWeightKg ?? "—"} {profile?.targetWeightKg ? "kg" : ""}
          </p>
        </div>
      </div>

      <WeightChart entries={chartEntries} />
      <WeightEntryForm />

      <div className="space-y-2 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <h2 className="text-sm font-semibold">Activity</h2>
        <ActivityEntryForm />
      </div>
    </div>
  );
}
