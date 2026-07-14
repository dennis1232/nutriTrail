import { describe, expect, it } from "vitest";

import {
  calculateAgeYears,
  calculateCalorieTarget,
  calculateDefaultMacros,
} from "./calorie-target-service";

describe("calculateCalorieTarget", () => {
  it("computes a maintenance target with no adjustment", () => {
    const result = calculateCalorieTarget({
      sex: "MALE",
      ageYears: 30,
      heightCm: 180,
      weightKg: 80,
      activityLevel: "MODERATE",
      goal: "MAINTAIN",
    });

    // BMR = 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5 = 1780
    expect(result.bmr).toBe(1780);
    expect(result.maintenanceCalories).toBe(Math.round(1780 * 1.55));
    expect(result.dailyCalorieTarget).toBe(result.maintenanceCalories);
  });

  it("applies a conservative deficit for weight loss, never an extreme one", () => {
    const result = calculateCalorieTarget({
      sex: "FEMALE",
      ageYears: 28,
      heightCm: 165,
      weightKg: 65,
      activityLevel: "SEDENTARY",
      goal: "LOSE",
    });

    const deficit = result.maintenanceCalories - result.dailyCalorieTarget;
    expect(deficit).toBeGreaterThan(0);
    expect(deficit).toBeLessThanOrEqual(500);
  });

  it("never suggests below the safe calorie floor", () => {
    const result = calculateCalorieTarget({
      sex: "FEMALE",
      ageYears: 65,
      heightCm: 150,
      weightKg: 45,
      activityLevel: "SEDENTARY",
      goal: "LOSE",
    });

    expect(result.dailyCalorieTarget).toBeGreaterThanOrEqual(1200);
  });

  it("falls back to a sex-neutral average when sex is unspecified", () => {
    const male = calculateCalorieTarget({
      sex: "MALE",
      ageYears: 30,
      heightCm: 170,
      weightKg: 70,
      activityLevel: "SEDENTARY",
      goal: "MAINTAIN",
    });
    const female = calculateCalorieTarget({
      sex: "FEMALE",
      ageYears: 30,
      heightCm: 170,
      weightKg: 70,
      activityLevel: "SEDENTARY",
      goal: "MAINTAIN",
    });
    const unspecified = calculateCalorieTarget({
      sex: "UNSPECIFIED",
      ageYears: 30,
      heightCm: 170,
      weightKg: 70,
      activityLevel: "SEDENTARY",
      goal: "MAINTAIN",
    });

    expect(unspecified.bmr).toBeGreaterThan(female.bmr);
    expect(unspecified.bmr).toBeLessThan(male.bmr);
  });
});

describe("calculateDefaultMacros", () => {
  it("returns macros whose kcal roughly reconstructs the target", () => {
    const macros = calculateDefaultMacros(2000, "MAINTAIN");
    const reconstructed =
      macros.proteinGrams * 4 + macros.carbohydrateGrams * 4 + macros.fatGrams * 9;

    expect(Math.abs(reconstructed - 2000)).toBeLessThan(15);
  });

  it("weights protein higher for a weight-loss goal", () => {
    const lose = calculateDefaultMacros(2000, "LOSE");
    const maintain = calculateDefaultMacros(2000, "MAINTAIN");

    expect(lose.proteinGrams).toBeGreaterThan(maintain.proteinGrams);
  });
});

describe("calculateAgeYears", () => {
  it("computes age correctly before the birthday this year", () => {
    const birthDate = new Date("2000-06-15T00:00:00Z");
    const now = new Date("2026-06-14T00:00:00Z");
    expect(calculateAgeYears(birthDate, now)).toBe(25);
  });

  it("computes age correctly on/after the birthday this year", () => {
    const birthDate = new Date("2000-06-15T00:00:00Z");
    const now = new Date("2026-06-15T00:00:00Z");
    expect(calculateAgeYears(birthDate, now)).toBe(26);
  });
});
