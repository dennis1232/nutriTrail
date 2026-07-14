import { getLocale, getTranslations } from "next-intl/server";

import { Link, redirect } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { auth } from "@/server/auth";

export default async function LandingPage() {
  const session = await auth();
  const locale = await getLocale();

  if (session?.user) {
    redirect({ href: "/today", locale });
  }

  const t = await getTranslations("landing");

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 start-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-gradient-to-br from-emerald-200/60 via-teal-100/50 to-transparent blur-3xl dark:from-emerald-900/40 dark:via-teal-900/30"
      />
      <div className="relative w-full max-w-md text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icons/icon-192.png"
          alt=""
          className="animate-pop-in mx-auto mb-6 size-20 rounded-3xl shadow-xl shadow-emerald-500/20"
        />
        <h1 className="animate-fade-up stagger-1 font-heading text-4xl font-bold tracking-tight text-foreground">
          {t("title")}
        </h1>
        <p className="animate-fade-up stagger-2 mt-4 text-base leading-7 text-muted-foreground">
          {t("subtitle")}
        </p>
        <div className="animate-fade-up stagger-3 mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            size="lg"
            nativeButton={false}
            render={<Link href="/register" />}
            className="press-scale h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-6 text-base shadow-lg shadow-emerald-500/30 hover:from-emerald-600 hover:to-teal-700"
          >
            {t("cta_primary")}
          </Button>
          <Button
            size="lg"
            variant="outline"
            nativeButton={false}
            render={<Link href="/login" />}
            className="press-scale h-12 rounded-full px-6 text-base"
          >
            {t("cta_secondary")}
          </Button>
        </div>
        <p className="animate-fade-up stagger-4 mt-10 text-xs leading-5 text-muted-foreground/80">
          {t("disclaimer")}
        </p>
      </div>
    </main>
  );
}
