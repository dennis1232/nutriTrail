"use client";

import { useState, useTransition } from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { searchFoodsAction } from "@/server/actions/food-actions";
import { MealItemsForm, type DraftMealItem } from "@/components/meal/meal-items-form";

type FoodResult = {
  id: string;
  name: string;
  brand: string | null;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbohydratesPer100g: number;
  fatPer100g: number;
  servingSizeGrams: number | null;
  servingUnit: string | null;
};

export function FoodSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodResult[]>([]);
  const [isPending, startTransition] = useTransition();
  const [cart, setCart] = useState<DraftMealItem[]>([]);

  function onSearch() {
    startTransition(async () => {
      const found = await searchFoodsAction(query);
      setResults(found);
    });
  }

  function addToCart(food: FoodResult) {
    const baseGrams = food.servingSizeGrams ?? 100;
    const unit = food.servingUnit ?? "g";
    setCart((prev) => [
      ...prev,
      {
        key: `${food.id}-${Date.now()}`,
        foodId: food.id,
        displayName: food.brand ? `${food.name} (${food.brand})` : food.name,
        caloriesPer100g: food.caloriesPer100g,
        proteinPer100g: food.proteinPer100g,
        carbohydratesPer100g: food.carbohydratesPer100g,
        fatPer100g: food.fatPer100g,
        baseGrams,
        unit,
        quantity: 1,
      },
    ]);
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Input
          placeholder="Search foods…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearch()}
        />
        <Button type="button" onClick={onSearch} disabled={isPending}>
          <Search className="size-4" />
        </Button>
      </div>

      {results.length > 0 ? (
        <div className="space-y-2">
          {results.map((food) => (
            <button
              key={food.id}
              type="button"
              onClick={() => addToCart(food)}
              className="flex w-full items-center justify-between rounded-lg border border-zinc-200 p-3 text-left hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/60"
            >
              <div>
                <p className="text-sm font-medium">{food.name}</p>
                {food.brand ? (
                  <p className="text-xs text-zinc-500">{food.brand}</p>
                ) : null}
              </div>
              <span className="text-sm tabular-nums text-zinc-500">
                {Math.round(food.caloriesPer100g)} kcal/100g
              </span>
            </button>
          ))}
        </div>
      ) : null}

      <MealItemsForm
        items={cart}
        onItemsChange={setCart}
        defaultName="Custom meal"
        sourceType="MANUAL"
      />
    </div>
  );
}
