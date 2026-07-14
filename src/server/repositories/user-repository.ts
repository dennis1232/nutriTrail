import { prisma } from "@/server/db";

export function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export function createUserWithPassword(input: {
  name: string;
  email: string;
  passwordHash: string;
}) {
  return prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash: input.passwordHash,
    },
  });
}
