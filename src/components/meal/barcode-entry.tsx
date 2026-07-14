"use client";

import { useState, useTransition } from "react";
import { ScanBarcode } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { lookupBarcodeAction } from "@/server/actions/barcode-actions";
import { MealItemsForm, type DraftMealItem } from "@/components/meal/meal-items-form";
import { BarcodeCameraScanner } from "@/components/meal/barcode-camera-scanner";
import { Link } from "@/i18n/navigation";

export function BarcodeEntry() {
  const [barcode, setBarcode] = useState("");
  const [isPending, startTransition] = useTransition();
  const [notFound, setNotFound] = useState(false);
  const [cart, setCart] = useState<DraftMealItem[]>([]);

  function lookup(code: string) {
    setNotFound(false);
    startTransition(async () => {
      const result = await lookupBarcodeAction(code);
      if (!result.found) {
        setBarcode(code);
        setNotFound(true);
        return;
      }
      const food = result.food;
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
          baseGrams: food.servingSizeGrams ?? 100,
          unit: food.servingUnit ?? "g",
          quantity: 1,
        },
      ]);
      setBarcode("");
    });
  }

  function onLookup() {
    lookup(barcode);
  }

  return (
    <div className="space-y-6">
      <BarcodeCameraScanner onDetected={lookup} />

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
        <span className="flex items-center gap-1.5 text-xs text-zinc-500">
          <ScanBarcode className="size-3.5" /> or enter the number
        </span>
        <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
      </div>
      <div className="flex gap-2">
        <Input
          inputMode="numeric"
          placeholder="e.g. 0000000000017"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onLookup()}
        />
        <Button type="button" onClick={onLookup} disabled={isPending || !barcode}>
          Look up
        </Button>
      </div>

      {notFound ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          No product found for that barcode.{" "}
          <Link href="/add-meal/manual" className="font-medium underline">
            Create it manually
          </Link>
          .
        </p>
      ) : null}

      <MealItemsForm
        items={cart}
        onItemsChange={setCart}
        defaultName="Packaged food"
        sourceType="BARCODE"
      />
    </div>
  );
}
