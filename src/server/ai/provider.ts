import type { MealAnalysisResult } from "./schema";

export type MealAnalysisInput = {
  imageBuffer: Buffer;
  mimeType: string;
  userNote?: string;
};

/**
 * Abstraction over meal-photo analysis so the app is never coupled to a
 * single model vendor. Implementations must throw `MealAnalysisError` for
 * expected failure modes (timeout, provider outage, invalid response) so
 * callers can show a consistent, user-friendly error state.
 */
export interface MealAnalysisProvider {
  analyzeMeal(input: MealAnalysisInput): Promise<MealAnalysisResult>;
}

export type MealAnalysisErrorCode =
  | "TIMEOUT"
  | "PROVIDER_UNAVAILABLE"
  | "INVALID_RESPONSE"
  | "RATE_LIMITED";

export class MealAnalysisError extends Error {
  code: MealAnalysisErrorCode;

  constructor(code: MealAnalysisErrorCode, message: string) {
    super(message);
    this.name = "MealAnalysisError";
    this.code = code;
  }
}
