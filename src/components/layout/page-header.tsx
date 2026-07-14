"use client";

import { ChevronLeft } from "lucide-react";

import { useRouter } from "@/i18n/navigation";

/** iOS-style sub-page navigation bar: back chevron on the leading edge,
 * centered title, invisible trailing spacer to keep the title centered. */
export function PageHeader({ title }: { title: string }) {
  const router = useRouter();

  return (
    <div className="mb-4 flex items-center gap-2">
      <button
        type="button"
        onClick={() => router.back()}
        aria-label="Back"
        className="press-scale flex size-11 shrink-0 items-center justify-center rounded-full text-primary hover:bg-muted"
      >
        <ChevronLeft className="size-6 rtl:rotate-180" />
      </button>
      <h1 className="flex-1 truncate text-center font-heading text-lg font-bold text-foreground">
        {title}
      </h1>
      <span aria-hidden className="size-11 shrink-0" />
    </div>
  );
}
