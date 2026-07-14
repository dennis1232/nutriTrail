import { PageHeader } from "@/components/layout/page-header";
import { auth } from "@/server/auth";
import { findRecentMeals } from "@/server/repositories/meal-repository";
import { CopyMealButton } from "@/components/meal/meal-action-buttons";

export default async function CopyMealPage() {
  const session = await auth();
  const meals = await findRecentMeals(session!.user.id, 15);

  return (
    <div className="space-y-4">
      <PageHeader title="Copy a previous meal" />
      {meals.length === 0 ? (
        <p className="text-sm text-zinc-500">You haven&apos;t logged any meals yet.</p>
      ) : (
        <div className="space-y-2">
          {meals.map((meal) => {
            const calories = meal.items.reduce((sum, item) => sum + item.calories, 0);
            return (
              <div
                key={meal.id}
                className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div>
                  <p className="text-sm font-medium">{meal.name}</p>
                  <p className="text-xs text-zinc-500">
                    {new Date(meal.consumedAt).toLocaleDateString()} ·{" "}
                    {Math.round(calories)} kcal
                  </p>
                </div>
                <CopyMealButton mealId={meal.id} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
