"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { calculateNutrientsForGrams } from "@/server/services/nutrition-calculation-service";
import { saveMeal } from "@/server/actions/meal-actions";
import { useRouter } from "@/i18n/navigation";

export type DraftMealItem = {
  key: string;
  foodId?: string | null;
  displayName: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbohydratesPer100g: number;
  fatPer100g: number;
  baseGrams: number;
  unit: string;
  quantity: number;
  aiConfidence?: number | null;
  aiAssumptions?: string[];
};

type MealItemsFormProps = {
  items: DraftMealItem[];
  onItemsChange: (items: DraftMealItem[]) => void;
  defaultName: string;
  defaultCategory?: "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";
  sourceType?: "MANUAL" | "AI_PHOTO" | "BARCODE" | "SAVED_MEAL" | "COPIED";
  aiAnalysisId?: string | null;
  imageUrl?: string | null;
};

function inferCategoryFromTime(date: Date): "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK" {
  const hour = date.getHours();
  if (hour < 11) return "BREAKFAST";
  if (hour < 16) return "LUNCH";
  if (hour < 21) return "DINNER";
  return "SNACK";
}

function toDateTimeLocalValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

export function MealItemsForm({
  items,
  onItemsChange,
  defaultName,
  defaultCategory,
  sourceType = "MANUAL",
  aiAnalysisId,
  imageUrl,
}: MealItemsFormProps) {
  const t = useTranslations("dashboard");
  const tForm = useTranslations("mealForm");
  const router = useRouter();
  const [name, setName] = useState(defaultName);
  const [category, setCategory] = useState(
    defaultCategory ?? inferCategoryFromTime(new Date()),
  );
  const [consumedAt, setConsumedAt] = useState(toDateTimeLocalValue(new Date()));
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function updateQuantity(key: string, quantity: number) {
    onItemsChange(
      items.map((item) => (item.key === key ? { ...item, quantity } : item)),
    );
  }

  function removeItem(key: string) {
    onItemsChange(items.filter((item) => item.key !== key));
  }

  const computedItems = items.map((item) => {
    const grams = item.baseGrams * item.quantity;
    const nutrients = calculateNutrientsForGrams(
      {
        caloriesPer100g: item.caloriesPer100g,
        proteinPer100g: item.proteinPer100g,
        carbohydratesPer100g: item.carbohydratesPer100g,
        fatPer100g: item.fatPer100g,
      },
      grams,
    );
    return { ...item, grams, nutrients };
  });

  const totalCalories = computedItems.reduce((sum, i) => sum + i.nutrients.calories, 0);

  function onSave() {
    if (computedItems.length === 0) {
      setError(tForm("add_at_least_one"));
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await saveMeal({
        name: name || defaultName,
        category,
        consumedAt: new Date(consumedAt).toISOString(),
        sourceType,
        aiAnalysisId,
        imageUrl: imageUrl ?? undefined,
        items: computedItems.map((item) => ({
          foodId: item.foodId ?? null,
          displayName: item.displayName,
          quantity: item.quantity,
          unit: item.unit,
          grams: item.grams,
          calories: item.nutrients.calories,
          protein: item.nutrients.proteinGrams,
          carbohydrates: item.nutrients.carbohydrateGrams,
          fat: item.nutrients.fatGrams,
          aiConfidence: item.aiConfidence ?? null,
          aiAssumptions: item.aiAssumptions ?? [],
        })),
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (result.data.flaggedItems.length > 0) {
        toast.warning(
          tForm("unusual_values", { items: result.data.flaggedItems.join(", ") }),
        );
      }
      toast.success(tForm("meal_saved"));
      router.push("/today");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="meal-name">{tForm("meal_name")}</Label>
        <Input id="meal-name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>{tForm("category")}</Label>
          <Select
            value={category}
            onValueChange={(v) => v && setCategory(v as typeof category)}
            items={{
              BREAKFAST: t("breakfast"),
              LUNCH: t("lunch"),
              DINNER: t("dinner"),
              SNACK: t("snack"),
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BREAKFAST">{t("breakfast")}</SelectItem>
              <SelectItem value="LUNCH">{t("lunch")}</SelectItem>
              <SelectItem value="DINNER">{t("dinner")}</SelectItem>
              <SelectItem value="SNACK">{t("snack")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="consumedAt">{tForm("time")}</Label>
          <Input
            id="consumedAt"
            type="datetime-local"
            value={consumedAt}
            onChange={(e) => setConsumedAt(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        {computedItems.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-300 p-4 text-center text-sm text-zinc-500 dark:border-zinc-700">
            {tForm("no_items")}
          </p>
        ) : (
          computedItems.map((item) => (
            <div
              key={item.key}
              className="flex items-center gap-3 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.displayName}</p>
                <div className="mt-1 flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.25"
                    min="0"
                    className="h-7 w-20"
                    value={item.quantity}
                    onChange={(e) => updateQuantity(item.key, Number(e.target.value))}
                  />
                  <span className="text-xs text-zinc-500">
                    × {item.unit} ({Math.round(item.grams)}g)
                  </span>
                  {item.aiConfidence != null ? (
                    <Badge variant="secondary" className="text-[10px]">
                      {Math.round(item.aiConfidence * 100)}% confidence
                    </Badge>
                  ) : null}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold tabular-nums">
                  {Math.round(item.nutrients.calories)} kcal
                </p>
                <button
                  type="button"
                  onClick={() => removeItem(item.key)}
                  aria-label={tForm("remove", { name: item.displayName })}
                  className="mt-1 text-zinc-400 hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="flex items-center justify-between border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <p className="text-sm font-medium">
          {tForm("total")}:{" "}
          <span className="font-semibold">{Math.round(totalCalories)} kcal</span>
        </p>
        <Button onClick={onSave} disabled={isPending || computedItems.length === 0}>
          {tForm("save_meal")}
        </Button>
      </div>
    </div>
  );
}
