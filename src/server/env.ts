import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DIRECT_URL: z.string().min(1, "DIRECT_URL is required (same as DATABASE_URL locally)"),
  AUTH_SECRET: z.string().min(1, "AUTH_SECRET is required"),
  AUTH_URL: z.string().url().optional(),

  SMTP_HOST: z.string().optional().default(""),
  SMTP_PORT: z.coerce.number().optional().default(587),
  SMTP_USER: z.string().optional().default(""),
  SMTP_PASSWORD: z.string().optional().default(""),
  EMAIL_FROM: z.string().optional().default("NutriTrail <no-reply@example.com>"),

  AI_PROVIDER: z.enum(["mock", "openai"]).default("mock"),
  AI_API_KEY: z.string().optional().default(""),
  AI_MODEL: z.string().optional().default("gpt-4o-mini"),

  STORAGE_PROVIDER: z.enum(["local", "s3"]).default("local"),
  STORAGE_S3_BUCKET: z.string().optional().default(""),
  STORAGE_S3_REGION: z.string().optional().default(""),
  STORAGE_S3_ACCESS_KEY_ID: z.string().optional().default(""),
  STORAGE_S3_SECRET_ACCESS_KEY: z.string().optional().default(""),
  STORAGE_S3_ENDPOINT: z.string().optional().default(""),

  FOOD_PROVIDER: z.enum(["mock"]).default("mock"),

  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(
      `Invalid environment configuration:\n${issues}\n\nCheck your .env file against .env.example.`,
    );
  }

  return parsed.data;
}

export const env = loadEnv();
