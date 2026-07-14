"use client";

import { CalendarDays, House, LineChart, Settings } from "lucide-react";

import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type AppNavProps = {
  labels: {
    today: string;
    history: string;
    progress: string;
    settings: string;
  };
  variant: "tabbar" | "header";
};

export function AppNav({ labels, variant }: AppNavProps) {
  const pathname = usePathname();

  const items = [
    { href: "/today" as const, label: labels.today, icon: House },
    { href: "/history" as const, label: labels.history, icon: CalendarDays },
    { href: "/progress" as const, label: labels.progress, icon: LineChart },
    { href: "/settings" as const, label: labels.settings, icon: Settings },
  ];

  if (variant === "header") {
    return (
      <>
        {items.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50",
                isActive && "text-zinc-900 dark:text-zinc-50",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-1 px-2 py-2">
      {items.map((item) => {
        const isActive = pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "press-scale flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-medium text-muted-foreground transition-all duration-300",
              isActive
                ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/30"
                : "hover:bg-muted",
            )}
          >
            <Icon className="size-5" strokeWidth={isActive ? 2.25 : 1.75} />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
