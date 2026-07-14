import { env } from "@/server/env";
import { MockMealAnalysisProvider } from "./mock-provider";
import { OpenAiMealAnalysisProvider } from "./openai-provider";
import type { MealAnalysisProvider } from "./provider";

export function getMealAnalysisProvider(): MealAnalysisProvider {
  if (env.AI_PROVIDER === "openai" && env.AI_API_KEY) {
    return new OpenAiMealAnalysisProvider(env.AI_API_KEY, env.AI_MODEL);
  }
  return new MockMealAnalysisProvider();
}

export { MealAnalysisError } from "./provider";
export type { MealAnalysisInput, MealAnalysisProvider } from "./provider";
export { mealAnalysisResultSchema, type MealAnalysisResult } from "./schema";
export { isRateLimited } from "./rate-limiter";
