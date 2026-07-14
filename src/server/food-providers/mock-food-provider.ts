import type { BarcodeLookupResult, FoodProvider } from "./food-provider";

/**
 * Deterministic offline provider for local development and tests. Real
 * external lookups (e.g. Open Food Facts) can be added later behind this
 * same interface without touching call sites — see docs/implementation-plan.md
 * for why that adapter isn't wired to a live network call in this pass.
 */
const DEMO_PRODUCTS: Record<string, BarcodeLookupResult> = {
  "0000000000017": {
    name: "Plain Greek Yogurt",
    brand: "Demo Dairy",
    caloriesPer100g: 97,
    proteinPer100g: 9,
    carbohydratesPer100g: 3.6,
    fatPer100g: 5,
    servingSizeGrams: 170,
    servingUnit: "container",
  },
  "0000000000024": {
    name: "Rolled Oats",
    brand: "Demo Grains",
    caloriesPer100g: 379,
    proteinPer100g: 13,
    carbohydratesPer100g: 67,
    fatPer100g: 7,
    servingSizeGrams: 40,
    servingUnit: "serving",
  },
};

export class MockFoodProvider implements FoodProvider {
  async lookupBarcode(barcode: string): Promise<BarcodeLookupResult | null> {
    return DEMO_PRODUCTS[barcode] ?? null;
  }
}
