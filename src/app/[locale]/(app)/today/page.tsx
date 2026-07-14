import { getLocale, getTranslations } from "next-intl/server";

import { auth } from "@/server/auth";
import { findProfileByUserId } from "@/server/repositories/profile-repository";
import {
  findMealsForDay,
  findActivityEntriesForDay,
} from "@/server/repositories/meal-repository";
import { buildDaySummary, type DaySummaryMeal } from "@/server/services/day-summary-service";
import { NutritionProgress } from "@/components/dashboard/nutrition-progress";
import { MealCard } from "@/components/meal/meal-card";
import { AddMealButton } from "@/components/meal/add-meal-button";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

const CATEGORY_ORDER = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"] as const;

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

export default async function TodayPage() {
  const session = await auth();
  const userId = session!.user.id;
  const t = await getTranslations("dashboard");
  const locale = await getLocale();
  const dateLocale = locale === "he" ? "he-IL" : "en-US";

  const profile = await findProfileByUserId(userId);
  const now = new Date();
  const dayStart = startOfDay(now);
  const dayEnd = endOfDay(now);

  const [meals, activityEntries] = await Promise.all([
    findMealsForDay(userId, dayStart, dayEnd),
    findActivityEntriesForDay(userId, dayStart, dayEnd),
  ]);

  const summaryMeals: DaySummaryMeal[] = meals.map((meal) => ({
    id: meal.id,
    name: meal.name,
    category: meal.category,
    consumedAt: meal.consumedAt,
    imageUrl: meal.imageUrl,
    items: meal.items,
  }));

  const activityCalories = activityEntries.reduce(
    (sum, entry) => sum + entry.caloriesBurned,
    0,
  );

  const summary = buildDaySummary(summaryMeals, activityCalories, {
    dailyCalorieTarget: profile!.dailyCalorieTarget,
    proteinTargetGrams: profile!.proteinTargetGrams,
    carbohydrateTargetGrams: profile!.carbohydrateTargetGrams,
    fatTargetGrams: profile!.fatTargetGrams,
    includeActivityCalories: profile!.includeActivityCalories,
  });

  const categoryLabels: Record<(typeof CATEGORY_ORDER)[number], string> = {
    BREAKFAST: t("breakfast"),
    LUNCH: t("lunch"),
    DINNER: t("dinner"),
    SNACK: t("snack"),
  };

  const hasAnyMeals = meals.length > 0;

  const categoryEmoji: Record<(typeof CATEGORY_ORDER)[number], string> = {
    BREAKFAST: "🥣",
    LUNCH: "🥗",
    DINNER: "🍲",
    SNACK: "🍎",
  };

  return (
    <div className="space-y-6 pb-6">
      <div className="animate-fade-up flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            {t("greeting")}
          </h1>
          <p className="text-xs text-muted-foreground">
            {now.toLocaleDateString(dateLocale, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <AddMealButton label={t("add_meal")} />
      </div>

      <NutritionProgress
        caloriesConsumed={summary.totals.calories}
        caloriesTarget={profile!.dailyCalorieTarget}
        caloriesRemaining={summary.caloriesRemaining}
        protein={{ consumed: summary.totals.proteinGrams, target: profile!.proteinTargetGrams }}
        carbs={{
          consumed: summary.totals.carbohydrateGrams,
          target: profile!.carbohydrateTargetGrams,
        }}
        fat={{ consumed: summary.totals.fatGrams, target: profile!.fatTargetGrams }}
        labels={{
          remaining: t("calories_remaining"),
          consumed: t("calories_consumed"),
          protein: t("protein"),
          carbs: t("carbs"),
          fat: t("fat"),
        }}
      />

      {!hasAnyMeals ? (
        <div className="animate-fade-up stagger-2 rounded-2xl border border-dashed border-border bg-card/60 p-8 text-center">
          <p className="text-3xl">🌱</p>
          <p className="mt-2 font-heading font-semibold text-foreground">
            {t("empty_state_title")}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("empty_state_subtitle")}
          </p>
        </div>
      ) : (
        CATEGORY_ORDER.map((category, index) => {
          const categoryMeals = summary.mealsByCategory[category];
          if (categoryMeals.length === 0) return null;
          return (
            <section
              key={category}
              className={`animate-fade-up stagger-${Math.min(4, index + 2)}`}
            >
              <h2 className="mb-2 flex items-center gap-1.5 font-heading text-sm font-semibold text-foreground">
                <span aria-hidden>{categoryEmoji[category]}</span>
                {categoryLabels[category]}
              </h2>
              <div className="space-y-2">
                {categoryMeals.map((meal) => {
                  const mealCalories = meal.items.reduce(
                    (sum, item) => sum + item.calories,
                    0,
                  );
                  return (
                    <MealCard
                      key={meal.id}
                      id={meal.id}
                      name={meal.name}
                      category={category}
                      time={new Date(meal.consumedAt).toLocaleTimeString(dateLocale, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      calories={mealCalories}
                      imageUrl={meal.imageUrl}
                      hasAiEstimate={meal.items.some(
                        (item) => item.aiConfidence !== null,
                      )}
                    />
                  );
                })}
              </div>
            </section>
          );
        })
      )}

      <Button variant="link" nativeButton={false} render={<Link href="/history" />} className="px-0">
        {t("recent_meals")}
      </Button>
    </div>
  );
}
