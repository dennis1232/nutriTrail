"use server";

import { auth } from "@/server/auth";
import { getFoodProvider } from "@/server/food-providers";
import { findFoodByBarcode, createFood } from "@/server/repositories/food-repository";

export type BarcodeLookupActionResult =
  | { found: true; food: NonNullable<Awaited<ReturnType<typeof findFoodByBarcode>>> }
  | { found: false };

export async function lookupBarcodeAction(
  barcode: string,
): Promise<BarcodeLookupActionResult> {
  const session = await auth();
  if (!session?.user) {
    return { found: false };
  }

  const trimmed = barcode.trim();
  if (!trimmed) return { found: false };

  const cached = await findFoodByBarcode(trimmed);
  if (cached) {
    return { found: true, food: cached };
  }

  const provider = getFoodProvider();
  const result = await provider.lookupBarcode(trimmed);
  if (!result) {
    return { found: false };
  }

  const food = await createFood({
    ownerId: null,
    name: result.name,
    brand: result.brand,
    barcode: trimmed,
    source: "BARCODE_EXTERNAL",
    caloriesPer100g: result.caloriesPer100g,
    proteinPer100g: result.proteinPer100g,
    carbohydratesPer100g: result.carbohydratesPer100g,
    fatPer100g: result.fatPer100g,
    servingSizeGrams: result.servingSizeGrams,
    servingUnit: result.servingUnit,
    verified: false,
  });

  return { found: true, food };
}
