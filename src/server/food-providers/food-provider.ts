/**
 * Abstraction over external packaged-food lookups (barcode scanning).
 * Implementations must never throw for a "not found" result — they should
 * resolve to `null` so callers can fall back to manual entry.
 */
export type BarcodeLookupResult = {
  name: string;
  brand: string | null;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbohydratesPer100g: number;
  fatPer100g: number;
  servingSizeGrams: number | null;
  servingUnit: string | null;
};

export interface FoodProvider {
  lookupBarcode(barcode: string): Promise<BarcodeLookupResult | null>;
}
