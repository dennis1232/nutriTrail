import { randomUUID } from "node:crypto";

import type { MealAnalysisInput, MealAnalysisProvider } from "./provider";
import { mealAnalysisResultSchema, type MealAnalysisResult } from "./schema";

type MockFoodTemplate = {
  name: string;
  preparationMethod?: string;
  estimatedQuantity: number;
  unit: string;
  estimatedGrams: number;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbPer100g: number;
  fatPer100g: number;
  confidence: number;
  assumptions: string[];
};

const KEYWORD_TEMPLATES: Record<string, MockFoodTemplate> = {
  chicken: {
    name: "Grilled chicken breast",
    preparationMethod: "grilled",
    estimatedQuantity: 1,
    unit: "piece",
    estimatedGrams: 150,
    caloriesPer100g: 165,
    proteinPer100g: 31,
    carbPer100g: 0,
    fatPer100g: 3.6,
    confidence: 0.75,
    assumptions: [],
  },
  rice: {
    name: "White rice",
    estimatedQuantity: 1,
    unit: "cup",
    estimatedGrams: 158,
    caloriesPer100g: 130,
    proteinPer100g: 2.7,
    carbPer100g: 28,
    fatPer100g: 0.3,
    confidence: 0.7,
    assumptions: [],
  },
  salad: {
    name: "Mixed green salad",
    estimatedQuantity: 1,
    unit: "cup",
    estimatedGrams: 90,
    caloriesPer100g: 20,
    proteinPer100g: 1.4,
    carbPer100g: 3.8,
    fatPer100g: 0.2,
    confidence: 0.65,
    assumptions: ["Dressing amount not visible and not included"],
  },
  bread: {
    name: "Bread slice",
    estimatedQuantity: 2,
    unit: "slice",
    estimatedGrams: 60,
    caloriesPer100g: 265,
    proteinPer100g: 9,
    carbPer100g: 49,
    fatPer100g: 3.2,
    confidence: 0.7,
    assumptions: [],
  },
};

const DEFAULT_TEMPLATE: MockFoodTemplate[] = [
  {
    name: "Mixed plate",
    estimatedQuantity: 1,
    unit: "serving",
    estimatedGrams: 350,
    caloriesPer100g: 180,
    proteinPer100g: 10,
    carbPer100g: 18,
    fatPer100g: 7,
    confidence: 0.5,
    assumptions: ["No matching food keywords detected in the note; this is a generic estimate"],
  },
];

function pickTemplates(userNote: string | undefined): MockFoodTemplate[] {
  if (!userNote) return DEFAULT_TEMPLATE;

  const lower = userNote.toLowerCase();
  const matches = Object.entries(KEYWORD_TEMPLATES)
    .filter(([keyword]) => lower.includes(keyword))
    .map(([, template]) => template);

  return matches.length > 0 ? matches : DEFAULT_TEMPLATE;
}

function templateToFood(template: MockFoodTemplate, note?: string) {
  const factor = template.estimatedGrams / 100;
  const assumptions = [...template.assumptions];

  if (note && /\boil\b/.test(note.toLowerCase()) && template.name !== "Mixed plate") {
    assumptions.push("Included user-reported cooking oil in the estimate");
  }

  return {
    temporaryId: randomUUID(),
    name: template.name,
    preparationMethod: template.preparationMethod,
    estimatedQuantity: template.estimatedQuantity,
    unit: template.unit,
    estimatedGrams: template.estimatedGrams,
    calories: Math.round(template.caloriesPer100g * factor),
    proteinGrams: Math.round(template.proteinPer100g * factor * 10) / 10,
    carbohydrateGrams: Math.round(template.carbPer100g * factor * 10) / 10,
    fatGrams: Math.round(template.fatPer100g * factor * 10) / 10,
    confidence: template.confidence,
    assumptions,
  };
}

/**
 * Deterministic offline provider. Ignores the actual image bytes (there is
 * no real vision model here) and instead varies its output based on
 * keywords in the optional user note — this keeps the review/edit flow
 * genuinely exercised in development and E2E tests without a paid API key.
 */
export class MockMealAnalysisProvider implements MealAnalysisProvider {
  async analyzeMeal(input: MealAnalysisInput): Promise<MealAnalysisResult> {
    // Simulate realistic latency so loading states are exercised.
    await new Promise((resolve) => setTimeout(resolve, 600));

    const templates = pickTemplates(input.userNote);
    const detectedFoods = templates.map((template) =>
      templateToFood(template, input.userNote),
    );

    const totals = detectedFoods.reduce(
      (acc, food) => ({
        calories: acc.calories + food.calories,
        proteinGrams: acc.proteinGrams + food.proteinGrams,
        carbohydrateGrams: acc.carbohydrateGrams + food.carbohydrateGrams,
        fatGrams: acc.fatGrams + food.fatGrams,
      }),
      { calories: 0, proteinGrams: 0, carbohydrateGrams: 0, fatGrams: 0 },
    );

    const result = {
      mealName: "Analyzed meal (mock)",
      summary:
        "This is a mock estimate for local development — no real image analysis was performed.",
      detectedFoods,
      totals,
      generalAssumptions: [
        "Mock provider: quantities are illustrative and not derived from the actual photo.",
      ],
      needsUserReview: true as const,
    };

    return mealAnalysisResultSchema.parse(result);
  }
}
