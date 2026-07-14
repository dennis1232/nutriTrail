import { describe, expect, it } from "vitest";

import { buildDaySummary, type DaySummaryMeal } from "./day-summary-service";

function meal(
  category: DaySummaryMeal["category"],
  calories: number,
): DaySummaryMeal {
  return {
    id: crypto.randomUUID(),
    name: "Test meal",
    category,
    consumedAt: new Date(),
    imageUrl: null,
    items: [
      {
        id: crypto.randomUUID(),
        displayName: "Item",
        quantity: 1,
        unit: "serving",
        grams: 100,
        calories,
        protein: 10,
        carbohydrates: 10,
        fat: 5,
        aiConfidence: null,
      },
    ],
  };
}

const targets = {
  dailyCalorieTarget: 2000,
  proteinTargetGrams: 120,
  carbohydrateTargetGrams: 200,
  fatTargetGrams: 60,
  includeActivityCalories: false,
};

describe("buildDaySummary", () => {
  it("groups meals by category and sums totals", () => {
    const meals = [meal("BREAKFAST", 300), meal("LUNCH", 500), meal("SNACK", 150)];
    const summary = buildDaySummary(meals, 0, targets);

    expect(summary.mealsByCategory.BREAKFAST).toHaveLength(1);
    expect(summary.mealsByCategory.LUNCH).toHaveLength(1);
    expect(summary.mealsByCategory.DINNER).toHaveLength(0);
    expect(summary.totals.calories).toBe(950);
  });

  it("computes calories remaining against the target", () => {
    const summary = buildDaySummary([meal("LUNCH", 800)], 0, targets);
    expect(summary.caloriesRemaining).toBe(1200);
  });

  it("only adds activity calories to the budget when the preference is enabled", () => {
    const withActivity = buildDaySummary([meal("LUNCH", 800)], 300, {
      ...targets,
      includeActivityCalories: true,
    });
    const withoutActivity = buildDaySummary([meal("LUNCH", 800)], 300, {
      ...targets,
      includeActivityCalories: false,
    });

    expect(withActivity.caloriesRemaining).toBe(1500);
    expect(withoutActivity.caloriesRemaining).toBe(1200);
  });

  it("returns zeroed totals with no meals logged", () => {
    const summary = buildDaySummary([], 0, targets);
    expect(summary.totals.calories).toBe(0);
    expect(summary.caloriesRemaining).toBe(2000);
  });
});
