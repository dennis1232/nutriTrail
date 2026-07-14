import { z } from "zod";

export const mealCategorySchema = z.enum([
  "BREAKFAST",
  "LUNCH",
  "DINNER",
  "SNACK",
]);

export const mealItemSchema = z.object({
  foodId: z.string().nullish(),
  displayName: z.string().trim().min(1).max(120),
  quantity: z.number().positive().max(10000),
  unit: z.string().min(1).max(20),
  grams: z.number().min(0).max(20000),
  calories: z.number().min(0).max(20000),
  protein: z.number().min(0).max(2000),
  carbohydrates: z.number().min(0).max(2000),
  fat: z.number().min(0).max(2000),
  aiConfidence: z.number().min(0).max(1).nullish(),
  aiAssumptions: z.array(z.string()).optional(),
});

export const createMealSchema = z.object({
  name: z.string().trim().min(1).max(120),
  category: mealCategorySchema,
  consumedAt: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Invalid date"),
  notes: z.string().max(500).optional(),
  imageUrl: z.string().max(2000).optional(),
  sourceType: z
    .enum(["MANUAL", "AI_PHOTO", "BARCODE", "SAVED_MEAL", "COPIED"])
    .default("MANUAL"),
  aiAnalysisId: z.string().nullish(),
  items: z.array(mealItemSchema).min(1, "Add at least one food item"),
});

export type CreateMealInput = z.infer<typeof createMealSchema>;

export const createCustomFoodSchema = z.object({
  name: z.string().trim().min(1).max(120),
  brand: z.string().trim().max(120).optional(),
  caloriesPer100g: z.number().min(0).max(1000),
  proteinPer100g: z.number().min(0).max(120),
  carbohydratesPer100g: z.number().min(0).max(120),
  fatPer100g: z.number().min(0).max(120),
  fiberPer100g: z.number().min(0).max(60).optional(),
  servingSizeGrams: z.number().min(0).max(5000).optional(),
  servingUnit: z.string().max(20).optional(),
});

export type CreateCustomFoodInput = z.infer<typeof createCustomFoodSchema>;

export const weightEntrySchema = z.object({
  weightKg: z.number().min(20).max(400),
  recordedAt: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Invalid date"),
  notes: z.string().max(300).optional(),
});

export const activityEntrySchema = z.object({
  name: z.string().trim().min(1).max(120),
  durationMinutes: z.number().int().min(1).max(1440),
  caloriesBurned: z.number().int().min(0).max(5000),
  performedAt: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Invalid date"),
});
