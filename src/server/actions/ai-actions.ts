"use server";

import { auth } from "@/server/auth";
import { prisma } from "@/server/db";
import { getMealAnalysisProvider, isRateLimited, MealAnalysisError } from "@/server/ai";
import { MEAL_ANALYSIS_PROMPT_VERSION } from "@/ai/prompts/meal-analysis-v1";
import { getStorageProvider } from "@/server/storage";
import type { MealAnalysisResult } from "@/server/ai";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB

export type AnalyzeMealPhotoResult =
  | { ok: true; analysisId: string; imageUrl: string; result: MealAnalysisResult }
  | { ok: false; error: string };

export async function analyzeMealPhoto(
  formData: FormData,
): Promise<AnalyzeMealPhotoResult> {
  const session = await auth();
  if (!session?.user) {
    return { ok: false, error: "You must be signed in." };
  }
  const userId = session.user.id;

  if (isRateLimited(userId)) {
    return {
      ok: false,
      error: "You've reached the meal-analysis limit for now. Please try again in a minute.",
    };
  }

  const file = formData.get("image");
  const note = formData.get("note");
  const userNote = typeof note === "string" && note.trim() ? note.trim() : undefined;

  if (!(file instanceof File)) {
    return { ok: false, error: "No image was provided." };
  }
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return { ok: false, error: "Unsupported image format. Use JPEG, PNG, or WebP." };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: "Image is too large. Maximum size is 8MB." };
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const extension = file.type.split("/")[1] ?? "jpg";

  const storage = getStorageProvider();
  const stored = await storage.saveImage(buffer, extension);

  const provider = getMealAnalysisProvider();

  const analysis = await prisma.aIAnalysis.create({
    data: {
      userId,
      provider: provider.constructor.name,
      model: process.env.AI_MODEL ?? "mock",
      promptVersion: MEAL_ANALYSIS_PROMPT_VERSION,
      status: "PENDING",
    },
  });

  try {
    const result = await provider.analyzeMeal({
      imageBuffer: buffer,
      mimeType: file.type,
      userNote,
    });

    await prisma.aIAnalysis.update({
      where: { id: analysis.id },
      data: {
        status: "SUCCEEDED",
        // Store only the sanitized, schema-validated result — never the
        // raw model payload or the image itself.
        sanitizedResponse: result,
        generalAssumptions: result.generalAssumptions,
      },
    });

    return { ok: true, analysisId: analysis.id, imageUrl: stored.url, result };
  } catch (error) {
    const message =
      error instanceof MealAnalysisError
        ? mapErrorToMessage(error)
        : "The AI provider failed to analyze this photo.";

    await prisma.aIAnalysis.update({
      where: { id: analysis.id },
      data: { status: "FAILED", errorMessage: message },
    });

    return { ok: false, error: message };
  }
}

function mapErrorToMessage(error: MealAnalysisError): string {
  switch (error.code) {
    case "TIMEOUT":
      return "The AI provider took too long to respond. Please try again.";
    case "RATE_LIMITED":
      return "The AI provider is rate-limiting requests right now. Please try again shortly.";
    case "INVALID_RESPONSE":
      return "The AI provider returned an unexpected response. Please try again or add the meal manually.";
    case "PROVIDER_UNAVAILABLE":
    default:
      return "The AI provider is unavailable right now. Please try again or add the meal manually.";
  }
}
