"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { deleteMeal, duplicateMealToToday } from "@/server/actions/meal-actions";
import { saveMealAsReusable } from "@/server/actions/saved-meal-actions";
import { useRouter } from "@/i18n/navigation";

export function MealDetailActions({ mealId }: { mealId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const result = await duplicateMealToToday(mealId);
            if (!result.ok) {
              toast.error(result.error);
              return;
            }
            toast.success("Duplicated to today");
            router.push("/today");
            router.refresh();
          })
        }
      >
        Duplicate
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const result = await saveMealAsReusable(mealId);
            if (!result.ok) {
              toast.error(result.error);
              return;
            }
            toast.success("Saved as a reusable meal");
          })
        }
      >
        Save as reusable meal
      </Button>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const result = await deleteMeal(mealId);
            if (!result.ok) {
              toast.error(result.error);
              return;
            }
            toast.success("Meal deleted");
            router.push("/today");
            router.refresh();
          })
        }
      >
        Delete
      </Button>
    </div>
  );
}
