import { notFound } from "next/navigation";

import { auth } from "@/server/auth";
import { findMealById } from "@/server/repositories/meal-repository";
import { sumNutrientProfiles, roundForDisplay } from "@/server/services/nutrition-calculation-service";
import { Badge } from "@/components/ui/badge";
import { MealDetailActions } from "@/components/meal/meal-detail-actions";
import { PageHeader } from "@/components/layout/page-header";

export default async function MealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const meal = await findMealById(session!.user.id, id);

  if (!meal) {
    notFound();
  }

  const totals = roundForDisplay(
    sumNutrientProfiles(
      meal.items.map((item) => ({
        calories: item.calories,
        proteinGrams: item.protein,
        carbohydrateGrams: item.carbohydrates,
        fatGrams: item.fat,
      })),
    ),
  );

  return (
    <div className="space-y-6">
      <PageHeader title={meal.name} />

      {meal.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={meal.imageUrl}
          alt=""
          className="aspect-video w-full rounded-2xl object-cover"
        />
      ) : null}

      <p className="text-sm text-muted-foreground">
        {new Date(meal.consumedAt).toLocaleString()}
      </p>

      <div className="grid grid-cols-4 gap-3 rounded-2xl border border-zinc-200 bg-white p-4 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <Stat label="kcal" value={totals.calories} />
        <Stat label="protein" value={`${totals.proteinGrams}g`} />
        <Stat label="carbs" value={`${totals.carbohydrateGrams}g`} />
        <Stat label="fat" value={`${totals.fatGrams}g`} />
      </div>

      <div className="space-y-2">
        {meal.items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div>
              <p className="text-sm font-medium">{item.displayName}</p>
              <p className="text-xs text-zinc-500">
                {item.quantity} × {item.unit} ({Math.round(item.grams)}g)
              </p>
              {item.aiAssumptions.length > 0 ? (
                <p className="mt-1 text-xs text-amber-600 dark:text-amber-500">
                  Assumed: {item.aiAssumptions.join(", ")}
                </p>
              ) : null}
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold">{Math.round(item.calories)} kcal</p>
              {item.aiConfidence != null ? (
                <Badge variant="secondary" className="text-[10px]">
                  {Math.round(item.aiConfidence * 100)}% confidence — estimate
                </Badge>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <MealDetailActions mealId={meal.id} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-sm font-semibold tabular-nums">{value}</p>
      <p className="text-[11px] uppercase text-zinc-500">{label}</p>
    </div>
  );
}
