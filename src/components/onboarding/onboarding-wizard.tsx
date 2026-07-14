"use client";

import { useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import { onboardingSchema, type OnboardingInput } from "@/server/validation/onboarding";
import { completeOnboarding } from "@/server/actions/onboarding-actions";
import {
  calculateAgeYears,
  calculateCalorieTarget,
} from "@/server/services/calorie-target-service";
import {
  feetInchesToCm,
  lbToKg,
} from "@/server/services/unit-conversion-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "@/i18n/navigation";

const TOTAL_STEPS = 4;

type ImperialHeight = { feet: string; inches: string };

export function OnboardingWizard() {
  const t = useTranslations("onboarding");
  const locale = useLocale();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [targetOverridden, setTargetOverridden] = useState(false);

  const [unitSystem, setUnitSystem] = useState<"METRIC" | "IMPERIAL">("METRIC");
  const [imperialHeight, setImperialHeight] = useState<ImperialHeight>({
    feet: "",
    inches: "",
  });
  const [imperialWeightLb, setImperialWeightLb] = useState("");
  const [imperialTargetWeightLb, setImperialTargetWeightLb] = useState("");

  const form = useForm<OnboardingInput>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      displayName: "",
      preferredLocale: locale === "he" ? "he" : "en",
      unitSystem: "METRIC",
      birthDate: "",
      biologicalSex: "UNSPECIFIED",
      heightCm: 170,
      currentWeightKg: 70,
      activityLevel: "SEDENTARY",
      nutritionGoal: "MAINTAIN",
      dailyCalorieTarget: 2000,
      proteinTargetGrams: 125,
      carbohydrateTargetGrams: 225,
      fatTargetGrams: 67,
    },
  });

  const values = form.watch();

  const suggestion = useMemo(() => {
    if (!values.birthDate || Number.isNaN(Date.parse(values.birthDate))) {
      return null;
    }
    const ageYears = calculateAgeYears(new Date(values.birthDate));
    if (ageYears < 0 || ageYears > 120) return null;

    return calculateCalorieTarget({
      sex: values.biologicalSex ?? "UNSPECIFIED",
      ageYears,
      heightCm: Number(values.heightCm) || 0,
      weightKg: Number(values.currentWeightKg) || 0,
      activityLevel: values.activityLevel,
      goal: values.nutritionGoal,
    });
  }, [
    values.birthDate,
    values.biologicalSex,
    values.heightCm,
    values.currentWeightKg,
    values.activityLevel,
    values.nutritionGoal,
  ]);

  function applySuggestionToForm() {
    if (!suggestion || targetOverridden) return;
    form.setValue("dailyCalorieTarget", suggestion.dailyCalorieTarget);
    form.setValue("proteinTargetGrams", suggestion.macros.proteinGrams);
    form.setValue("carbohydrateTargetGrams", suggestion.macros.carbohydrateGrams);
    form.setValue("fatTargetGrams", suggestion.macros.fatGrams);
  }

  function onUnitSystemChange(next: "METRIC" | "IMPERIAL" | null) {
    if (!next) return;
    setUnitSystem(next);
    form.setValue("unitSystem", next);
  }

  function onImperialHeightChange(next: ImperialHeight) {
    setImperialHeight(next);
    const feet = Number(next.feet) || 0;
    const inches = Number(next.inches) || 0;
    form.setValue("heightCm", Math.round(feetInchesToCm(feet, inches)));
  }

  function onImperialWeightChange(lb: string) {
    setImperialWeightLb(lb);
    form.setValue("currentWeightKg", Math.round(lbToKg(Number(lb) || 0) * 10) / 10);
  }

  function onImperialTargetWeightChange(lb: string) {
    setImperialTargetWeightLb(lb);
    if (!lb) {
      form.setValue("targetWeightKg", undefined);
      return;
    }
    form.setValue("targetWeightKg", Math.round(lbToKg(Number(lb)) * 10) / 10);
  }

  async function goNext() {
    const fieldsByStep: Record<number, (keyof OnboardingInput)[]> = {
      1: ["displayName", "preferredLocale", "birthDate"],
      2: ["heightCm", "currentWeightKg"],
      3: ["activityLevel", "nutritionGoal"],
      4: [
        "dailyCalorieTarget",
        "proteinTargetGrams",
        "carbohydrateTargetGrams",
        "fatTargetGrams",
      ],
    };

    const isValid = await form.trigger(fieldsByStep[step]);
    if (!isValid) return;

    if (step === 3) {
      applySuggestionToForm();
    }

    if (step < TOTAL_STEPS) {
      setStep(step + 1);
      return;
    }

    setFormError(null);
    startTransition(async () => {
      const rawValues = form.getValues();
      const payload = {
        ...rawValues,
        // An untouched optional number input registers with `valueAsNumber`
        // as NaN rather than undefined — normalize before validating.
        targetWeightKg: Number.isNaN(rawValues.targetWeightKg)
          ? undefined
          : rawValues.targetWeightKg,
      };
      const result = await completeOnboarding(payload);
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      toast.success(t("finish"));
      router.push("/today");
      router.refresh();
    });
  }

  function goBack() {
    setStep(Math.max(1, step - 1));
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-10">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {t("step_of", { current: step, total: TOTAL_STEPS })}
      </p>

      {step === 1 && (
        <div className="mt-3 space-y-4">
          <h1 className="text-xl font-semibold">{t("step_basics_title")}</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {t("step_basics_subtitle")}
          </p>
          <div className="space-y-2">
            <Label htmlFor="displayName">{t("display_name")}</Label>
            <Input id="displayName" {...form.register("displayName")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="birthDate">{t("adult_confirmation")}</Label>
            <Input id="birthDate" type="date" {...form.register("birthDate")} />
            {form.formState.errors.birthDate ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.birthDate.message}
              </p>
            ) : null}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="mt-3 space-y-4">
          <h1 className="text-xl font-semibold">{t("step_body_title")}</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {t("step_body_subtitle")}
          </p>

          <div className="space-y-2">
            <Label>{t("units")}</Label>
            <Select
              value={unitSystem}
              onValueChange={onUnitSystemChange}
              items={{ METRIC: t("units_metric"), IMPERIAL: t("units_imperial") }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="METRIC">{t("units_metric")}</SelectItem>
                <SelectItem value="IMPERIAL">{t("units_imperial")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {unitSystem === "METRIC" ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="heightCm">{t("height")} (cm)</Label>
                <Input
                  id="heightCm"
                  type="number"
                  {...form.register("heightCm", { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentWeightKg">{t("current_weight")} (kg)</Label>
                <Input
                  id="currentWeightKg"
                  type="number"
                  step="0.1"
                  {...form.register("currentWeightKg", { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetWeightKg">
                  {t("target_weight_optional")} (kg)
                </Label>
                <Input
                  id="targetWeightKg"
                  type="number"
                  step="0.1"
                  {...form.register("targetWeightKg", { valueAsNumber: true })}
                />
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>{t("height")} (ft)</Label>
                  <Input
                    type="number"
                    value={imperialHeight.feet}
                    onChange={(event) =>
                      onImperialHeightChange({
                        ...imperialHeight,
                        feet: event.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>(in)</Label>
                  <Input
                    type="number"
                    value={imperialHeight.inches}
                    onChange={(event) =>
                      onImperialHeightChange({
                        ...imperialHeight,
                        inches: event.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("current_weight")} (lb)</Label>
                <Input
                  type="number"
                  value={imperialWeightLb}
                  onChange={(event) => onImperialWeightChange(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("target_weight_optional")} (lb)</Label>
                <Input
                  type="number"
                  value={imperialTargetWeightLb}
                  onChange={(event) =>
                    onImperialTargetWeightChange(event.target.value)
                  }
                />
              </div>
            </>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="mt-3 space-y-4">
          <h1 className="text-xl font-semibold">{t("step_goal_title")}</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {t("step_goal_subtitle")}
          </p>
          <div className="space-y-2">
            <Label>{t("activity_level")}</Label>
            <Select
              value={values.activityLevel}
              onValueChange={(value) =>
                form.setValue("activityLevel", value as OnboardingInput["activityLevel"])
              }
              items={{
                SEDENTARY: t("activity_sedentary"),
                LIGHT: t("activity_light"),
                MODERATE: t("activity_moderate"),
                ACTIVE: t("activity_active"),
                VERY_ACTIVE: t("activity_very_active"),
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SEDENTARY">{t("activity_sedentary")}</SelectItem>
                <SelectItem value="LIGHT">{t("activity_light")}</SelectItem>
                <SelectItem value="MODERATE">{t("activity_moderate")}</SelectItem>
                <SelectItem value="ACTIVE">{t("activity_active")}</SelectItem>
                <SelectItem value="VERY_ACTIVE">{t("activity_very_active")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("step_goal_title")}</Label>
            <Select
              value={values.nutritionGoal}
              onValueChange={(value) =>
                form.setValue("nutritionGoal", value as OnboardingInput["nutritionGoal"])
              }
              items={{
                MAINTAIN: t("goal_maintain"),
                LOSE: t("goal_lose"),
                GAIN: t("goal_gain"),
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MAINTAIN">{t("goal_maintain")}</SelectItem>
                <SelectItem value="LOSE">{t("goal_lose")}</SelectItem>
                <SelectItem value="GAIN">{t("goal_gain")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="mt-3 space-y-4">
          <h1 className="text-xl font-semibold">{t("step_target_title")}</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {t("step_target_subtitle")}
          </p>

          <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <p className="text-xs font-medium uppercase text-zinc-500">
              {t("suggested_target")}
            </p>
            <p className="mt-1 text-3xl font-semibold">
              {values.dailyCalorieTarget}{" "}
              <span className="text-sm font-normal text-zinc-500">kcal</span>
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <MacroField
              label={t("protein")}
              value={values.proteinTargetGrams}
              onChange={(v) => {
                setTargetOverridden(true);
                form.setValue("proteinTargetGrams", v);
              }}
            />
            <MacroField
              label={t("carbs")}
              value={values.carbohydrateTargetGrams}
              onChange={(v) => {
                setTargetOverridden(true);
                form.setValue("carbohydrateTargetGrams", v);
              }}
            />
            <MacroField
              label={t("fat")}
              value={values.fatTargetGrams}
              onChange={(v) => {
                setTargetOverridden(true);
                form.setValue("fatTargetGrams", v);
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dailyCalorieTarget">{t("override_target")}</Label>
            <Input
              id="dailyCalorieTarget"
              type="number"
              value={values.dailyCalorieTarget}
              onChange={(event) => {
                setTargetOverridden(true);
                form.setValue("dailyCalorieTarget", Number(event.target.value));
              }}
            />
          </div>

          <p className="text-xs leading-5 text-zinc-500">
            {t("estimate_disclaimer")}
          </p>
        </div>
      )}

      {formError ? (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {formError}
        </p>
      ) : null}

      <div className="mt-8 flex gap-3">
        {step > 1 ? (
          <Button type="button" variant="outline" onClick={goBack}>
            {t("back")}
          </Button>
        ) : null}
        <Button type="button" className="flex-1" onClick={goNext} disabled={isPending}>
          {step === TOTAL_STEPS ? t("finish") : t("continue")}
        </Button>
      </div>
    </div>
  );
}

function MacroField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="justify-center text-xs">{label}</Label>
      <Input
        type="number"
        className="text-center"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <span className="text-[11px] text-zinc-500">g</span>
    </div>
  );
}
