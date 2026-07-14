import { describe, expect, it } from "vitest";

import { MockMealAnalysisProvider } from "./mock-provider";
import { mealAnalysisResultSchema } from "./schema";

describe("MockMealAnalysisProvider", () => {
  it("returns a schema-valid result with no user note", async () => {
    const provider = new MockMealAnalysisProvider();
    const result = await provider.analyzeMeal({
      imageBuffer: Buffer.from("fake"),
      mimeType: "image/jpeg",
    });

    expect(() => mealAnalysisResultSchema.parse(result)).not.toThrow();
    expect(result.needsUserReview).toBe(true);
    expect(result.detectedFoods.length).toBeGreaterThan(0);
  });

  it("varies detected foods based on keywords in the user note", async () => {
    const provider = new MockMealAnalysisProvider();
    const chickenResult = await provider.analyzeMeal({
      imageBuffer: Buffer.from("fake"),
      mimeType: "image/jpeg",
      userNote: "Grilled chicken with rice",
    });

    const names = chickenResult.detectedFoods.map((f) => f.name);
    expect(names).toContain("Grilled chicken breast");
    expect(names).toContain("White rice");
  });

  it("falls back to a generic estimate when no keywords match", async () => {
    const provider = new MockMealAnalysisProvider();
    const result = await provider.analyzeMeal({
      imageBuffer: Buffer.from("fake"),
      mimeType: "image/jpeg",
      userNote: "something unusual",
    });

    expect(result.detectedFoods).toHaveLength(1);
    expect(result.detectedFoods[0].name).toBe("Mixed plate");
  });

  it("never reports confidence of 1 (never claims exact accuracy)", async () => {
    const provider = new MockMealAnalysisProvider();
    const result = await provider.analyzeMeal({
      imageBuffer: Buffer.from("fake"),
      mimeType: "image/jpeg",
      userNote: "chicken and salad",
    });

    for (const food of result.detectedFoods) {
      expect(food.confidence).toBeLessThan(1);
    }
  });

  it("computes totals consistent with the sum of detected foods", async () => {
    const provider = new MockMealAnalysisProvider();
    const result = await provider.analyzeMeal({
      imageBuffer: Buffer.from("fake"),
      mimeType: "image/jpeg",
      userNote: "chicken and rice",
    });

    const expectedCalories = result.detectedFoods.reduce((sum, f) => sum + f.calories, 0);
    expect(result.totals.calories).toBe(expectedCalories);
  });
});

describe("mealAnalysisResultSchema", () => {
  it("rejects a response missing needsUserReview: true", () => {
    const invalid = {
      mealName: "Test",
      summary: "Test",
      detectedFoods: [
        {
          temporaryId: "1",
          name: "Food",
          estimatedQuantity: 1,
          unit: "serving",
          calories: 100,
          proteinGrams: 5,
          carbohydrateGrams: 10,
          fatGrams: 2,
          confidence: 0.5,
          assumptions: [],
        },
      ],
      totals: { calories: 100, proteinGrams: 5, carbohydrateGrams: 10, fatGrams: 2 },
      generalAssumptions: [],
      needsUserReview: false,
    };

    expect(mealAnalysisResultSchema.safeParse(invalid).success).toBe(false);
  });

  it("rejects a response with an empty detectedFoods array", () => {
    const invalid = {
      mealName: "Test",
      summary: "Test",
      detectedFoods: [],
      totals: { calories: 0, proteinGrams: 0, carbohydrateGrams: 0, fatGrams: 0 },
      generalAssumptions: [],
      needsUserReview: true,
    };

    expect(mealAnalysisResultSchema.safeParse(invalid).success).toBe(false);
  });

  it("rejects negative nutrient values", () => {
    const invalid = {
      mealName: "Test",
      summary: "Test",
      detectedFoods: [
        {
          temporaryId: "1",
          name: "Food",
          estimatedQuantity: 1,
          unit: "serving",
          calories: -5,
          proteinGrams: 5,
          carbohydrateGrams: 10,
          fatGrams: 2,
          confidence: 0.5,
          assumptions: [],
        },
      ],
      totals: { calories: 100, proteinGrams: 5, carbohydrateGrams: 10, fatGrams: 2 },
      generalAssumptions: [],
      needsUserReview: true,
    };

    expect(mealAnalysisResultSchema.safeParse(invalid).success).toBe(false);
  });
});
