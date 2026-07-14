import { PageHeader } from "@/components/layout/page-header";
import { auth } from "@/server/auth";
import { findSavedMealsForUser } from "@/server/repositories/saved-meal-repository";
import {
  AddSavedMealButton,
  DeleteSavedMealButton,
} from "@/components/meal/meal-action-buttons";

export default async function SavedMealsPage() {
  const session = await auth();
  const savedMeals = await findSavedMealsForUser(session!.user.id);

  return (
    <div className="space-y-4">
      <PageHeader title="Saved meals" />
      {savedMeals.length === 0 ? (
        <p className="text-sm text-zinc-500">
          No saved meals yet. Save one from a meal&apos;s details page.
        </p>
      ) : (
        <div className="space-y-2">
          {savedMeals.map((meal) => {
            const calories = meal.items.reduce((sum, item) => sum + item.calories, 0);
            return (
              <div
                key={meal.id}
                className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div>
                  <p className="text-sm font-medium">{meal.name}</p>
                  <p className="text-xs text-zinc-500">{Math.round(calories)} kcal</p>
                </div>
                <div className="flex gap-2">
                  <AddSavedMealButton savedMealId={meal.id} />
                  <DeleteSavedMealButton savedMealId={meal.id} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
