import { MEAL_ANALYSIS_SYSTEM_PROMPT } from "@/ai/prompts/meal-analysis-v1";
import type { MealAnalysisInput, MealAnalysisProvider } from "./provider";
import { MealAnalysisError } from "./provider";
import { mealAnalysisResultSchema, type MealAnalysisResult } from "./schema";

const REQUEST_TIMEOUT_MS = 20_000;
const MAX_RETRIES = 2;

/**
 * Real adapter for an OpenAI-compatible chat-completions vision endpoint.
 * Disabled by default (see env.ts / AI_PROVIDER) — the app never requires a
 * paid API key to run. Never trusts the raw response: always parses it
 * through `mealAnalysisResultSchema` before returning it to the caller.
 */
export class OpenAiMealAnalysisProvider implements MealAnalysisProvider {
  constructor(
    private readonly apiKey: string,
    private readonly model: string,
  ) {}

  async analyzeMeal(input: MealAnalysisInput): Promise<MealAnalysisResult> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await this.requestOnce(input);
      } catch (error) {
        lastError = error;
        if (error instanceof MealAnalysisError && error.code === "INVALID_RESPONSE") {
          // Retrying won't fix a malformed response from the same prompt.
          throw error;
        }
      }
    }

    if (lastError instanceof MealAnalysisError) throw lastError;
    throw new MealAnalysisError(
      "PROVIDER_UNAVAILABLE",
      "The AI provider did not respond after several attempts.",
    );
  }

  private async requestOnce(input: MealAnalysisInput): Promise<MealAnalysisResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const base64Image = input.imageBuffer.toString("base64");
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: this.model,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: MEAL_ANALYSIS_SYSTEM_PROMPT },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: input.userNote
                    ? `User note: ${input.userNote}`
                    : "No additional note provided.",
                },
                {
                  type: "image_url",
                  image_url: { url: `data:${input.mimeType};base64,${base64Image}` },
                },
              ],
            },
          ],
        }),
      });

      if (response.status === 429) {
        throw new MealAnalysisError("RATE_LIMITED", "The AI provider rate-limited this request.");
      }
      if (!response.ok) {
        throw new MealAnalysisError(
          "PROVIDER_UNAVAILABLE",
          `AI provider responded with status ${response.status}.`,
        );
      }

      const payload = await response.json();
      const content = payload?.choices?.[0]?.message?.content;
      if (typeof content !== "string") {
        throw new MealAnalysisError("INVALID_RESPONSE", "AI provider returned no content.");
      }

      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(content);
      } catch {
        throw new MealAnalysisError("INVALID_RESPONSE", "AI provider response was not valid JSON.");
      }

      const validated = mealAnalysisResultSchema.safeParse(parsedJson);
      if (!validated.success) {
        throw new MealAnalysisError(
          "INVALID_RESPONSE",
          "AI provider response did not match the expected schema.",
        );
      }

      return validated.data;
    } catch (error) {
      if (error instanceof MealAnalysisError) throw error;
      if (error instanceof Error && error.name === "AbortError") {
        throw new MealAnalysisError("TIMEOUT", "The AI provider took too long to respond.");
      }
      throw new MealAnalysisError("PROVIDER_UNAVAILABLE", "Failed to reach the AI provider.");
    } finally {
      clearTimeout(timeout);
    }
  }
}
