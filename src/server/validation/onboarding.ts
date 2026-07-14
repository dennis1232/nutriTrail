import { z } from "zod";

const MIN_ADULT_AGE = 18;

function isAtLeastAge(birthDate: Date, minAge: number, now = new Date()) {
  const age =
    now.getFullYear() -
    birthDate.getFullYear() -
    (now.getMonth() < birthDate.getMonth() ||
    (now.getMonth() === birthDate.getMonth() && now.getDate() < birthDate.getDate())
      ? 1
      : 0);
  return age >= minAge;
}

export const onboardingSchema = z.object({
  displayName: z.string().trim().min(1).max(80),
  preferredLocale: z.enum(["en", "he"]),
  unitSystem: z.enum(["METRIC", "IMPERIAL"]),
  birthDate: z
    .string()
    .refine((value) => !Number.isNaN(Date.parse(value)), "Invalid date")
    .refine(
      (value) => isAtLeastAge(new Date(value), MIN_ADULT_AGE),
      "You must be 18 or older to use NutriTrail",
    ),
  biologicalSex: z.enum(["MALE", "FEMALE", "UNSPECIFIED"]),
  heightCm: z.number().min(100).max(250),
  currentWeightKg: z.number().min(30).max(300),
  targetWeightKg: z.number().min(30).max(300).optional(),
  activityLevel: z.enum([
    "SEDENTARY",
    "LIGHT",
    "MODERATE",
    "ACTIVE",
    "VERY_ACTIVE",
  ]),
  nutritionGoal: z.enum(["MAINTAIN", "LOSE", "GAIN"]),
  dailyCalorieTarget: z.number().int().min(1200).max(6000),
  proteinTargetGrams: z.number().int().min(0).max(500),
  carbohydrateTargetGrams: z.number().int().min(0).max(900),
  fatTargetGrams: z.number().int().min(0).max(400),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
