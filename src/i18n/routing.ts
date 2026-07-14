import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "he"],
  defaultLocale: "en",
  localePrefix: "always",
});

export type AppLocaleParam = (typeof routing.locales)[number];

export const localeDirection: Record<AppLocaleParam, "ltr" | "rtl"> = {
  en: "ltr",
  he: "rtl",
};
