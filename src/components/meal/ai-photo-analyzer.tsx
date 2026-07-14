"use client";

import { useRef, useState, useTransition } from "react";
import { Camera, ImageUp, Loader2, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { analyzeMealPhoto } from "@/server/actions/ai-actions";
import { MealItemsForm, type DraftMealItem } from "@/components/meal/meal-items-form";

function detectedFoodToDraftItem(food: {
  temporaryId: string;
  name: string;
  estimatedQuantity: number;
  unit: string;
  estimatedGrams?: number;
  calories: number;
  proteinGrams: number;
  carbohydrateGrams: number;
  fatGrams: number;
  confidence: number;
  assumptions: string[];
}): DraftMealItem {
  const grams = food.estimatedGrams && food.estimatedGrams > 0 ? food.estimatedGrams : 100;
  const factor = 100 / grams;

  return {
    key: food.temporaryId,
    foodId: null,
    displayName: food.name,
    caloriesPer100g: food.calories * factor,
    proteinPer100g: food.proteinGrams * factor,
    carbohydratesPer100g: food.carbohydrateGrams * factor,
    fatPer100g: food.fatGrams * factor,
    baseGrams: grams,
    unit: food.unit,
    quantity: food.estimatedQuantity || 1,
    aiConfidence: food.confidence,
    aiAssumptions: food.assumptions,
  };
}

export function AiPhotoAnalyzer() {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<{
    analysisId: string;
    imageUrl: string;
    summary: string;
    generalAssumptions: string[];
  } | null>(null);
  const [items, setItems] = useState<DraftMealItem[]>([]);

  function onFileChange(selected: File | null) {
    setFile(selected);
    setPreviewUrl(selected ? URL.createObjectURL(selected) : null);
  }

  function onAnalyze() {
    if (!file) return;
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("image", file);
      formData.set("note", note);

      const result = await analyzeMealPhoto(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }

      setAnalysis({
        analysisId: result.analysisId,
        imageUrl: result.imageUrl,
        summary: result.result.summary,
        generalAssumptions: result.result.generalAssumptions,
      });
      setItems(result.result.detectedFoods.map(detectedFoodToDraftItem));
    });
  }

  if (analysis) {
    return (
      <div className="space-y-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={analysis.imageUrl}
          alt=""
          className="aspect-video w-full rounded-xl object-cover"
        />
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <div>
            <p>{analysis.summary}</p>
            <p className="mt-1">
              These are estimates. Review and correct every item before saving —
              nothing is saved automatically.
            </p>
            {analysis.generalAssumptions.length > 0 ? (
              <ul className="mt-1 list-inside list-disc">
                {analysis.generalAssumptions.map((assumption) => (
                  <li key={assumption}>{assumption}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>

        <MealItemsForm
          items={items}
          onItemsChange={setItems}
          defaultName={analysis.summary ? "Analyzed meal" : "Analyzed meal"}
          sourceType="AI_PHOTO"
          aiAnalysisId={analysis.analysisId}
          imageUrl={analysis.imageUrl}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <input
        ref={cameraInputRef}
        id="meal-photo"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className="hidden"
        onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
      />

      <button
        type="button"
        onClick={() => (previewUrl ? galleryInputRef.current?.click() : cameraInputRef.current?.click())}
        className="flex aspect-square w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50 text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900"
      >
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <>
            <Camera className="size-10" strokeWidth={1.5} />
            <span className="text-sm font-medium">Tap to take or choose a photo</span>
          </>
        )}
      </button>

      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" onClick={() => cameraInputRef.current?.click()}>
          <Camera className="size-4" /> Take photo
        </Button>
        <Button type="button" variant="outline" onClick={() => galleryInputRef.current?.click()}>
          <ImageUp className="size-4" /> Choose from gallery
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="meal-note">
          Add context (optional) — e.g. &quot;cooked with one tablespoon of oil&quot;
        </Label>
        <Textarea
          id="meal-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
        />
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Button onClick={onAnalyze} disabled={!file || isPending} className="w-full">
        {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
        {isPending ? "Analyzing…" : "Analyze photo"}
      </Button>
    </div>
  );
}
