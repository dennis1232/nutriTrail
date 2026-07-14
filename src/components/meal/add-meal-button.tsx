"use client";

import { useState } from "react";
import { Camera, Barcode, Search, UtensilsCrossed, Copy, Bookmark } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export function AddMealButton({ label }: { label: string }) {
  const t = useTranslations("addMeal");
  const [open, setOpen] = useState(false);

  const options = [
    {
      href: "/add-meal/photo",
      icon: Camera,
      title: t("photo"),
      desc: t("photo_desc"),
      tint: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    },
    {
      href: "/add-meal/search",
      icon: Search,
      title: t("search"),
      desc: t("search_desc"),
      tint: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
    },
    {
      href: "/add-meal/barcode",
      icon: Barcode,
      title: t("barcode"),
      desc: t("barcode_desc"),
      tint: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
    },
    {
      href: "/add-meal/manual",
      icon: UtensilsCrossed,
      title: t("manual"),
      desc: t("manual_desc"),
      tint: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    },
    {
      href: "/add-meal/copy",
      icon: Copy,
      title: t("copy"),
      desc: t("copy_desc"),
      tint: "bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300",
    },
    {
      href: "/add-meal/saved",
      icon: Bookmark,
      title: t("saved"),
      desc: t("saved_desc"),
      tint: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
    },
  ] as const;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button size="sm">{label}</Button>} />
      <SheetContent side="bottom" className="max-h-[85vh]">
        <SheetHeader>
          <SheetTitle>{t("title")}</SheetTitle>
        </SheetHeader>
        <div className="grid gap-2 px-4 pb-6">
          {options.map((option, index) => {
            const Icon = option.icon;
            return (
              <Link
                key={option.href}
                href={option.href}
                onClick={() => setOpen(false)}
                className={`press-scale animate-fade-up stagger-${Math.min(4, index + 1)} flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md`}
              >
                <div
                  className={`flex size-10 shrink-0 items-center justify-center rounded-full ${option.tint}`}
                >
                  <Icon className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-card-foreground">
                    {option.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{option.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
