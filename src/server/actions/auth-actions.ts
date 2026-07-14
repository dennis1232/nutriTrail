"use server";

import bcrypt from "bcryptjs";

import { registerSchema } from "@/server/validation/auth";
import {
  createUserWithPassword,
  findUserByEmail,
} from "@/server/repositories/user-repository";

export type RegisterActionResult =
  | { ok: true }
  | { ok: false; error: string };

export async function registerUser(
  input: unknown,
): Promise<RegisterActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const existing = await findUserByEmail(parsed.data.email);
  if (existing) {
    return { ok: false, error: "An account with this email already exists." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  await createUserWithPassword({
    name: parsed.data.name,
    email: parsed.data.email,
    passwordHash,
  });

  return { ok: true };
}
