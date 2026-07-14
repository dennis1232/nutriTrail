"use server";

import { auth } from "@/server/auth";
import { searchFoods, getRecentFoodsForUser } from "@/server/repositories/food-repository";

export async function searchFoodsAction(query: string) {
  const session = await auth();
  if (!session?.user) return [];
  return searchFoods(session.user.id, query.trim());
}

export async function getRecentFoodsAction() {
  const session = await auth();
  if (!session?.user) return [];
  return getRecentFoodsForUser(session.user.id);
}
