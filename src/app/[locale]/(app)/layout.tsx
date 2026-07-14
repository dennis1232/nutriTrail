import { getLocale, getTranslations } from "next-intl/server";

import { auth } from "@/server/auth";
import { redirect } from "@/i18n/navigation";
import { findProfileByUserId } from "@/server/repositories/profile-repository";
import { AppNav } from "@/components/layout/app-nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const locale = await getLocale();
  if (!session?.user) {
    redirect({ href: "/login", locale });
  }

  const profile = await findProfileByUserId(session!.user.id);
  if (!profile?.onboardingCompletedAt) {
    redirect({ href: "/onboarding", locale });
  }

  const t = await getTranslations("nav");

  return (
    <div className="flex flex-1 flex-col pb-28 sm:pb-0">
      <header className="pt-safe sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <span className="flex items-center gap-2 font-heading text-sm font-bold text-foreground">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/icon-192.png" alt="" className="size-6 rounded-lg" />
            NutriTrail
          </span>
          <nav className="hidden gap-4 sm:flex">
            <AppNav labels={{
              today: t("today"),
              history: t("history"),
              progress: t("progress"),
              settings: t("settings"),
            }} variant="header" />
          </nav>
        </div>
      </header>

      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-4">{children}</div>

      <nav className="mb-safe fixed inset-x-3 bottom-0 z-10 rounded-2xl border border-border bg-card/95 shadow-lg shadow-black/10 backdrop-blur sm:hidden">
        <AppNav
          labels={{
            today: t("today"),
            history: t("history"),
            progress: t("progress"),
            settings: t("settings"),
          }}
          variant="tabbar"
        />
      </nav>
    </div>
  );
}
