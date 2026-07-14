import { env } from "@/server/env";
import { MockFoodProvider } from "./mock-food-provider";
import type { FoodProvider } from "./food-provider";

export function getFoodProvider(): FoodProvider {
  switch (env.FOOD_PROVIDER) {
    case "mock":
    default:
      return new MockFoodProvider();
  }
}
