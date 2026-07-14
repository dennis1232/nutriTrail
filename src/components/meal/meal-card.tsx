import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type MealCategory = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";

const CATEGORY_STYLE: Record<MealCategory, { emoji: string; tint: string }> = {
  BREAKFAST: { emoji: "🥣", tint: "bg-amber-100 dark:bg-amber-950" },
  LUNCH: { emoji: "🥗", tint: "bg-sky-100 dark:bg-sky-950" },
  DINNER: { emoji: "🍲", tint: "bg-violet-100 dark:bg-violet-950" },
  SNACK: { emoji: "🍎", tint: "bg-pink-100 dark:bg-pink-950" },
};

type MealCardProps = {
  id: string;
  name: string;
  time: string;
  calories: number;
  imageUrl?: string | null;
  hasAiEstimate?: boolean;
  category?: MealCategory;
};

export function MealCard({
  id,
  name,
  time,
  calories,
  imageUrl,
  hasAiEstimate,
  category = "SNACK",
}: MealCardProps) {
  const style = CATEGORY_STYLE[category];

  return (
    <Link
      href={`/meal/${id}`}
      className="press-scale flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md"
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- local/user-uploaded images, no fixed known dimensions
        <img
          src={imageUrl}
          alt=""
          className="size-12 shrink-0 rounded-xl object-cover"
        />
      ) : (
        <div
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-xl text-xl",
            style.tint,
          )}
        >
          {style.emoji}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-card-foreground">{name}</p>
        <p className="text-xs text-muted-foreground">{time}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="font-heading text-sm font-bold tabular-nums text-card-foreground">
          {Math.round(calories)} kcal
        </span>
        {hasAiEstimate ? (
          <Badge variant="secondary" className="text-[10px]">
            AI estimate
          </Badge>
        ) : null}
      </div>
    </Link>
  );
}
