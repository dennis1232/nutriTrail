import { getLocale } from "next-intl/server";

import { auth } from "@/server/auth";
import { prisma } from "@/server/db";
import { redirect } from "@/i18n/navigation";
import { findProfileByUserId } from "@/server/repositories/profile-repository";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export default async function OnboardingPage() {
  const session = await auth();
  const locale = await getLocale();

  if (!session?.user) {
    redirect({ href: "/login", locale });
  }

  // A JWT session can outlive its user row (account deleted, database
  // reset) — treat that as logged out rather than showing a form that can
  // never submit.
  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: { id: true },
  });
  if (!user) {
    redirect({ href: "/login", locale });
  }

  const profile = await findProfileByUserId(session!.user.id);
  if (profile?.onboardingCompletedAt) {
    redirect({ href: "/today", locale });
  }

  return (
    <main className="flex flex-1 flex-col">
      <OnboardingWizard />
    </main>
  );
}
