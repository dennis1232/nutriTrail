import type { Metadata } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { Heebo, Rubik } from "next/font/google";

import { routing, localeDirection, type AppLocaleParam } from "@/i18n/routing";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// Both families cover Hebrew and Latin, so RTL and LTR render consistently.
const rubik = Rubik({
  variable: "--font-display",
  subsets: ["latin", "hebrew"],
  weight: ["400", "500", "600", "700"],
});

const heebo = Heebo({
  variable: "--font-body",
  subsets: ["latin", "hebrew"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "NutriTrail",
  description:
    "Mobile-first nutrition tracking with AI-assisted meal logging you always review before saving.",
  appleWebApp: {
    capable: true,
    title: "NutriTrail",
    statusBarStyle: "default",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport = {
  themeColor: "#18181b",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const typedLocale = locale as AppLocaleParam;
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      dir={localeDirection[typedLocale]}
      className={`${rubik.variable} ${heebo.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background">
        <NextIntlClientProvider messages={messages}>
          {children}
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
