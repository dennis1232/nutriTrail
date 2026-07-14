"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { duplicateMealToToday } from "@/server/actions/meal-actions";
import {
  addSavedMealToToday,
  deleteSavedMeal,
} from "@/server/actions/saved-meal-actions";
import { useRouter } from "@/i18n/navigation";

export function CopyMealButton({ mealId }: { mealId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const result = await duplicateMealToToday(mealId);
          if (!result.ok) {
            toast.error(result.error);
            return;
          }
          toast.success("Added to today");
          router.push("/today");
          router.refresh();
        })
      }
    >
      Copy to today
    </Button>
  );
}

export function AddSavedMealButton({ savedMealId }: { savedMealId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      size="sm"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const result = await addSavedMealToToday(savedMealId);
          if (!result.ok) {
            toast.error(result.error);
            return;
          }
          toast.success("Added to today");
          router.push("/today");
          router.refresh();
        })
      }
    >
      Add to today
    </Button>
  );
}

export function DeleteSavedMealButton({ savedMealId }: { savedMealId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const result = await deleteSavedMeal(savedMealId);
          if (!result.ok) {
            toast.error(result.error);
            return;
          }
          router.refresh();
        })
      }
    >
      Delete
    </Button>
  );
}
