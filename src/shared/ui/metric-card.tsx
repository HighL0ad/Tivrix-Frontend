import type { ReactNode } from "react";

import { cn } from "@/shared/lib/utils";
import { Card, CardContent } from "@/shared/ui/card";

export function MetricCard({
  title,
  value,
  hint,
  tone = "neutral",
  icon,
  compact = false,
}: {
  title: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "good" | "bad" | "info" | "warning" | "violet";
  icon?: ReactNode;
  compact?: boolean;
}) {
  const toneStyle = {
    neutral: {
      card: "border-gray-200 before:from-gray-300 before:to-gray-500",
      icon: "text-gray-700 bg-gray-100",
    },
    good: {
      card: "border-emerald-200 before:from-emerald-400 before:to-teal-500",
      icon: "text-emerald-700 bg-emerald-100",
    },
    bad: {
      card: "border-rose-200 before:from-rose-400 before:to-red-500",
      icon: "text-rose-700 bg-rose-100",
    },
    info: {
      card: "border-blue-200 before:from-blue-400 before:to-indigo-500",
      icon: "text-indigo-700 bg-indigo-100",
    },
    warning: {
      card: "border-amber-200 before:from-amber-400 before:to-orange-500",
      icon: "text-amber-700 bg-amber-100",
    },
    violet: {
      card: "border-violet-200 before:from-violet-400 before:to-fuchsia-500",
      icon: "text-violet-700 bg-violet-100",
    },
  }[tone];

  return (
    <Card
      size="sm"
      className={cn(
        "relative bg-white shadow-none before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-linear-to-r",
        toneStyle.card,
      )}
    >
      <CardContent className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-bold uppercase tracking-wide text-gray-500">
            {title}
          </div>
          <div
            className={cn(
              "mt-2 break-words font-black tracking-tight text-gray-950",
              compact ? "text-lg" : "text-xl",
            )}
          >
            {value}
          </div>
          {hint ? <div className="mt-1 text-xs text-gray-500">{hint}</div> : null}
        </div>
        {icon ? (
          <div className={cn("rounded-lg border border-white/80 p-2 shadow-sm", toneStyle.icon)}>
            {icon}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
