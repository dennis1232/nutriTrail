"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { addWeightEntry } from "@/server/actions/meal-actions";
import { useRouter } from "@/i18n/navigation";

export function WeightEntryForm() {
  const router = useRouter();
  const [weight, setWeight] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await addWeightEntry({
        weightKg: Number(weight),
        recordedAt: new Date().toISOString(),
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success("Weight logged");
      setWeight("");
      router.refresh();
    });
  }

  return (
    <div className="flex gap-2">
      <Input
        type="number"
        step="0.1"
        placeholder="Weight (kg)"
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
      />
      <Button type="button" onClick={onSubmit} disabled={isPending || !weight}>
        Log weight
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
