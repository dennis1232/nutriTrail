"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { addActivityEntry } from "@/server/actions/meal-actions";
import { useRouter } from "@/i18n/navigation";

export function ActivityEntryForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("");
  const [calories, setCalories] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await addActivityEntry({
        name,
        durationMinutes: Number(duration),
        caloriesBurned: Number(calories),
        performedAt: new Date().toISOString(),
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success("Activity logged");
      setName("");
      setDuration("");
      setCalories("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-3 sm:col-span-1">
          <Label className="text-xs">Activity</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">Minutes</Label>
          <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">Calories</Label>
          <Input type="number" value={calories} onChange={(e) => setCalories(e.target.value)} />
        </div>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button
        type="button"
        variant="outline"
        onClick={onSubmit}
        disabled={isPending || !name || !duration || !calories}
      >
        Log activity
      </Button>
    </div>
  );
}
