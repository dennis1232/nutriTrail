import { auth } from "@/server/auth";
import { prisma } from "@/server/db";
import { sumNutrientProfiles, roundForDisplay } from "@/server/services/nutrition-calculation-service";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { CopyMealButton } from "@/components/meal/meal-action-buttons";
import { ChevronLeft, ChevronRight } from "lucide-react";

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
function endOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(24, 0, 0, 0);
  return d;
}
function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}
function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: dateParam } = await searchParams;
  const session = await auth();
  const userId = session!.user.id;

  const selectedDate = dateParam ? new Date(dateParam) : new Date();
  const dayStart = startOfDay(selectedDate);
  const dayEnd = endOfDay(selectedDate);

  const meals = await prisma.meal.findMany({
    where: { userId, consumedAt: { gte: dayStart, lt: dayEnd } },
    include: { items: true },
    orderBy: { consumedAt: "asc" },
  });

  const weekStart = addDays(dayStart, -6);
  const weekMeals = await prisma.meal.findMany({
    where: { userId, consumedAt: { gte: weekStart, lt: dayEnd } },
    include: { items: true },
  });

  const dailyTotals = new Map<string, number>();
  for (const meal of weekMeals) {
    const key = toIsoDate(meal.consumedAt);
    const calories = meal.items.reduce((sum, item) => sum + item.calories, 0);
    dailyTotals.set(key, (dailyTotals.get(key) ?? 0) + calories);
  }
  const daysWithData = dailyTotals.size || 1;
  const weeklyAvgCalories = Math.round(
    Array.from(dailyTotals.values()).reduce((a, b) => a + b, 0) / daysWithData,
  );

  const totals = roundForDisplay(
    sumNutrientProfiles(
      meals.flatMap((meal) =>
        meal.items.map((item) => ({
          calories: item.calories,
          proteinGrams: item.protein,
          carbohydrateGrams: item.carbohydrates,
          fatGrams: item.fat,
        })),
      ),
    ),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon-sm"
          nativeButton={false}
          render={<Link href={`/history?date=${toIsoDate(addDays(selectedDate, -7))}`} />}
        >
          <ChevronLeft className="size-4 rtl:rotate-180" />
        </Button>
        <h1 className="text-sm font-semibold">
          {selectedDate.toLocaleDateString(undefined, {
            month: "long",
            year: "numeric",
          })}
        </h1>
        <Button
          variant="ghost"
          size="icon-sm"
          nativeButton={false}
          render={<Link href={`/history?date=${toIsoDate(addDays(selectedDate, 7))}`} />}
        >
          <ChevronRight className="size-4 rtl:rotate-180" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 7 }, (_, i) => addDays(selectedDate, i - 6)).map((day) => {
          const iso = toIsoDate(day);
          const isSelected = iso === toIsoDate(selectedDate);
          return (
            <Link
              key={iso}
              href={`/history?date=${iso}`}
              className={
                isSelected
                  ? "flex flex-col items-center gap-0.5 rounded-xl bg-zinc-900 py-2 text-white dark:bg-zinc-50 dark:text-zinc-900"
                  : "flex flex-col items-center gap-0.5 rounded-xl py-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }
            >
              <span className="text-[10px] font-medium uppercase">
                {day.toLocaleDateString(undefined, { weekday: "narrow" })}
              </span>
              <span className="text-sm font-semibold tabular-nums">{day.getDate()}</span>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div>
          <p className="text-xs text-zinc-500">Logged meals</p>
          <p className="text-lg font-semibold">{meals.length}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-500">Day total</p>
          <p className="text-lg font-semibold">{totals.calories} kcal</p>
        </div>
        <div>
          <p className="text-xs text-zinc-500">7-day avg calories</p>
          <p className="text-lg font-semibold">{weeklyAvgCalories} kcal</p>
        </div>
        <div>
          <p className="text-xs text-zinc-500">Macros (P/C/F)</p>
          <p className="text-lg font-semibold">
            {totals.proteinGrams}/{totals.carbohydrateGrams}/{totals.fatGrams}g
          </p>
        </div>
      </div>

      {meals.length === 0 ? (
        <p className="text-sm text-zinc-500">No meals logged this day.</p>
      ) : (
        <div className="space-y-2">
          {meals.map((meal) => {
            const calories = meal.items.reduce((sum, item) => sum + item.calories, 0);
            return (
              <div
                key={meal.id}
                className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <Link href={`/meal/${meal.id}`} className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{meal.name}</p>
                  <p className="text-xs text-zinc-500">
                    {new Date(meal.consumedAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    · {Math.round(calories)} kcal
                  </p>
                </Link>
                <CopyMealButton mealId={meal.id} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
