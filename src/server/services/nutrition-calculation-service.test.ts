import { describe, expect, it } from "vitest";

import {
  assertNonNegativeNutrients,
  calculateNutrientsForGrams,
  calorieCrossCheckRatio,
  hasLargeCalorieDiscrepancy,
  roundForDisplay,
  sumNutrientProfiles,
} from "./nutrition-calculation-service";

const chickenBreastPer100g = {
  caloriesPer100g: 165,
  proteinPer100g: 31,
  carbohydratesPer100g: 0,
  fatPer100g: 3.6,
};

describe("calculateNutrientsForGrams", () => {
  it("scales nutrients linearly by grams", () => {
    const result = calculateNutrientsForGrams(chickenBreastPer100g, 150);

    expect(result.calories).toBeCloseTo(247.5);
    expect(result.proteinGrams).toBeCloseTo(46.5);
    expect(result.fatGrams).toBeCloseTo(5.4);
  });

  it("returns zero nutrients for zero grams", () => {
    const result = calculateNutrientsForGrams(chickenBreastPer100g, 0);
    expect(result.calories).toBe(0);
  });

  it("rejects negative or non-finite grams", () => {
    expect(() => calculateNutrientsForGrams(chickenBreastPer100g, -5)).toThrow();
    expect(() =>
      calculateNutrientsForGrams(chickenBreastPer100g, Number.NaN),
    ).toThrow();
  });
});

describe("sumNutrientProfiles", () => {
  it("sums multiple food items into a meal total without float drift issues", () => {
    const items = [
      calculateNutrientsForGrams(chickenBreastPer100g, 100),
      calculateNutrientsForGrams(chickenBreastPer100g, 50),
      calculateNutrientsForGrams(chickenBreastPer100g, 25),
    ];
    const total = sumNutrientProfiles(items);
    const expected = calculateNutrientsForGrams(chickenBreastPer100g, 175);

    expect(total.calories).toBeCloseTo(expected.calories, 5);
    expect(total.proteinGrams).toBeCloseTo(expected.proteinGrams, 5);
  });

  it("returns all zeros for an empty item list", () => {
    expect(sumNutrientProfiles([])).toEqual({
      calories: 0,
      proteinGrams: 0,
      carbohydrateGrams: 0,
      fatGrams: 0,
    });
  });
});

describe("roundForDisplay", () => {
  it("rounds calories to whole numbers and macros to one decimal", () => {
    const rounded = roundForDisplay({
      calories: 247.49,
      proteinGrams: 46.53,
      carbohydrateGrams: 0.041,
      fatGrams: 5.399,
    });

    expect(rounded).toEqual({
      calories: 247,
      proteinGrams: 46.5,
      carbohydrateGrams: 0,
      fatGrams: 5.4,
    });
  });
});

describe("calorie cross-check", () => {
  it("returns ~1.0 for internally-consistent data", () => {
    const ratio = calorieCrossCheckRatio({
      calories: 165,
      proteinGrams: 31,
      carbohydrateGrams: 0,
      fatGrams: 3.6,
    });
    expect(ratio).toBeCloseTo((31 * 4 + 3.6 * 9) / 165, 5);
  });

  it("flags a large discrepancy without needing to overwrite calories", () => {
    const suspicious = {
      calories: 50,
      proteinGrams: 30,
      carbohydrateGrams: 30,
      fatGrams: 30,
    };
    expect(hasLargeCalorieDiscrepancy(suspicious)).toBe(true);
  });

  it("does not flag small, normal rounding discrepancies", () => {
    const normal = {
      calories: 165,
      proteinGrams: 31,
      carbohydrateGrams: 0,
      fatGrams: 3.6,
    };
    expect(hasLargeCalorieDiscrepancy(normal)).toBe(false);
  });
});

describe("assertNonNegativeNutrients", () => {
  it("throws when any value is negative", () => {
    expect(() =>
      assertNonNegativeNutrients({
        calories: -1,
        proteinGrams: 0,
        carbohydrateGrams: 0,
        fatGrams: 0,
      }),
    ).toThrow();
  });

  it("does not throw for valid non-negative values", () => {
    expect(() =>
      assertNonNegativeNutrients({
        calories: 100,
        proteinGrams: 5,
        carbohydrateGrams: 10,
        fatGrams: 2,
      }),
    ).not.toThrow();
  });
});
