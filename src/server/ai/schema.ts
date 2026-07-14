import { z } from "zod";

/**
 * Strict schema for AI meal-analysis output. Raw model output is never
 * trusted or persisted directly — it must parse against this schema first.
 * Shape matches the spec's `MealAnalysisResult` contract.
 */
export const detectedFoodSchema = z.object({
  temporaryId: z.string(),
  name: z.string().min(1).max(120),
  preparationMethod: z.string().max(200).optional(),
  estimatedQuantity: z.number().positive().max(10000),
  unit: z.string().min(1).max(20),
  estimatedGrams: z.number().min(0).max(20000).optional(),
  calories: z.number().min(0).max(20000),
  proteinGrams: z.number().min(0).max(2000),
  carbohydrateGrams: z.number().min(0).max(2000),
  fatGrams: z.number().min(0).max(2000),
  confidence: z.number().min(0).max(1),
  assumptions: z.array(z.string()),
});

export const mealAnalysisResultSchema = z.object({
  mealName: z.string().min(1).max(120),
  summary: z.string().max(1000),
  detectedFoods: z.array(detectedFoodSchema).min(1),
  totals: z.object({
    calories: z.number().min(0),
    proteinGrams: z.number().min(0),
    carbohydrateGrams: z.number().min(0),
    fatGrams: z.number().min(0),
  }),
  generalAssumptions: z.array(z.string()),
  needsUserReview: z.literal(true),
});

export type DetectedFood = z.infer<typeof detectedFoodSchema>;
export type MealAnalysisResult = z.infer<typeof mealAnalysisResultSchema>;
