type CalorieRingProps = {
  caloriesConsumed: number;
  caloriesTarget: number;
  caloriesRemaining: number;
  remainingLabel: string;
  targetLabel: string;
};

const SIZE = 184;
const STROKE = 15;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function CalorieRing({
  caloriesConsumed,
  caloriesTarget,
  caloriesRemaining,
  remainingLabel,
  targetLabel,
}: CalorieRingProps) {
  const ratio = caloriesTarget > 0 ? caloriesConsumed / caloriesTarget : 0;
  const clamped = Math.min(1, Math.max(0, ratio));
  const dashOffset = CIRCUMFERENCE * (1 - clamped);
  const overBudget = caloriesRemaining < 0;

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative"
        style={{ width: SIZE, height: SIZE }}
        role="img"
        aria-label={`${Math.max(0, caloriesRemaining)} ${remainingLabel}, ${caloriesConsumed} of ${caloriesTarget} ${targetLabel}`}
      >
        <svg width={SIZE} height={SIZE} className="-rotate-90">
          <defs>
            <linearGradient id="calorie-ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="55%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#0d9488" />
            </linearGradient>
            <linearGradient id="calorie-ring-over" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#f97316" />
            </linearGradient>
          </defs>
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            strokeWidth={STROKE}
            className="stroke-emerald-100/80 dark:stroke-emerald-950"
          />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            stroke={overBudget ? "url(#calorie-ring-over)" : "url(#calorie-ring-gradient)"}
            className="animate-ring-draw transition-[stroke-dashoffset] duration-700"
            style={{ "--ring-circumference": CIRCUMFERENCE } as React.CSSProperties}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-heading text-4xl font-bold tabular-nums text-foreground">
            {Math.abs(caloriesRemaining).toLocaleString()}
          </span>
          <span className="text-xs font-medium text-muted-foreground">
            {remainingLabel}
          </span>
        </div>
      </div>
      <p className="mt-2 text-xs tabular-nums text-muted-foreground">
        {caloriesConsumed.toLocaleString()} / {caloriesTarget.toLocaleString()} {targetLabel}
      </p>
    </div>
  );
}
