import { Progress as ProgressPrimitive } from "@base-ui/react/progress";

import { CalorieRing } from "@/components/dashboard/calorie-ring";
import { cn } from "@/lib/utils";

type NutritionProgressProps = {
  caloriesConsumed: number;
  caloriesTarget: number;
  caloriesRemaining: number;
  protein: { consumed: number; target: number };
  carbs: { consumed: number; target: number };
  fat: { consumed: number; target: number };
  labels: {
    remaining: string;
    consumed: string;
    protein: string;
    carbs: string;
    fat: string;
  };
};

function percent(consumed: number, target: number) {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((consumed / target) * 100));
}

export function NutritionProgress({
  caloriesConsumed,
  caloriesTarget,
  caloriesRemaining,
  protein,
  carbs,
  fat,
  labels,
}: NutritionProgressProps) {
  return (
    <section
      aria-label="Daily nutrition progress"
      className="animate-pop-in stagger-1 rounded-3xl border border-border bg-card p-5 shadow-sm"
    >
      <div className="flex justify-center">
        <CalorieRing
          caloriesConsumed={caloriesConsumed}
          caloriesTarget={caloriesTarget}
          caloriesRemaining={caloriesRemaining}
          remainingLabel={labels.remaining}
          targetLabel={labels.consumed}
        />
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <MacroRow
          label={labels.protein}
          consumed={protein.consumed}
          target={protein.target}
          colorClassName="bg-sky-500"
        />
        <MacroRow
          label={labels.carbs}
          consumed={carbs.consumed}
          target={carbs.target}
          colorClassName="bg-amber-500"
        />
        <MacroRow
          label={labels.fat}
          consumed={fat.consumed}
          target={fat.target}
          colorClassName="bg-emerald-500"
        />
      </div>
    </section>
  );
}

function MacroRow({
  label,
  consumed,
  target,
  colorClassName,
}: {
  label: string;
  consumed: number;
  target: number;
  colorClassName: string;
}) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <span className={cn("size-2 rounded-full", colorClassName)} aria-hidden />
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums text-card-foreground">
        {Math.round(consumed)}g{" "}
        <span className="font-normal text-muted-foreground/70">
          / {Math.round(target)}g
        </span>
      </p>
      <ProgressPrimitive.Root value={percent(consumed, target)} className="mt-1.5">
        <ProgressPrimitive.Track className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
          <ProgressPrimitive.Indicator
            className={cn(
              "h-full rounded-full transition-all duration-700",
              colorClassName,
            )}
          />
        </ProgressPrimitive.Track>
      </ProgressPrimitive.Root>
    </div>
  );
}
