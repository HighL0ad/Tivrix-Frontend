import type { ReactNode } from "react";

import { cn } from "@/shared/lib/utils";
import { Card, CardContent } from "@/shared/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/ui/tooltip";

export function MetricCard({
  title,
  value,
  hint,
  tone = "neutral",
  icon,
  compact = false,
}: {
  title: string;
  value: ReactNode;
  hint?: string;
  tone?: "neutral" | "good" | "bad" | "info" | "warning" | "violet";
  icon?: ReactNode;
  compact?: boolean;
}) {
  const toneStyle = {
    neutral: {
      card: "border-gray-200 dark:border-border before:from-gray-300 before:to-gray-500",
      icon: "text-gray-700 bg-gray-100 dark:text-slate-300 dark:bg-slate-800",
    },
    good: {
      card: "border-emerald-200 dark:border-emerald-500/40 before:from-emerald-400 before:to-teal-500",
      icon: "text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-950/10",
    },
    bad: {
      card: "border-rose-200 dark:border-red-500/40 before:from-rose-400 before:to-red-500",
      icon: "text-rose-700 bg-rose-100 dark:text-red-300 dark:bg-red-950/10",
    },
    info: {
      card: "border-blue-200 dark:border-sky-500/40 before:from-blue-400 before:to-indigo-500",
      icon: "text-indigo-700 bg-indigo-100 dark:text-sky-300 dark:bg-sky-950/10",
    },
    warning: {
      card: "border-amber-200 dark:border-amber-500/40 before:from-amber-400 before:to-orange-500",
      icon: "text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-950/10",
    },
    violet: {
      card: "border-violet-200 dark:border-violet-500/40 before:from-violet-400 before:to-fuchsia-500",
      icon: "text-violet-700 bg-violet-100 dark:text-violet-300 dark:bg-violet-950/10",
    },
  }[tone];

  return (
    <Card
      size="sm"
      className={cn(
        "relative bg-card dark:bg-[#161f30]/65 text-card-foreground shadow-none dark:shadow-md dark:shadow-black/25 animate-in fade-in zoom-in-95 duration-500 before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-linear-to-r",
        toneStyle.card,
      )}
    >
      <CardContent className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="min-h-12 text-xs font-bold uppercase leading-4 tracking-wide text-muted-foreground">
                {title}
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-72 whitespace-normal break-words">
              {title}
            </TooltipContent>
          </Tooltip>
          <div
            className={cn(
              "mt-1 whitespace-nowrap font-black leading-none tracking-tight text-foreground",
              compact ? "text-lg" : "text-xl",
            )}
          >
            {value}
          </div>
          {hint ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="mt-1 truncate whitespace-nowrap text-xs text-muted-foreground">
                  {hint}
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-72 whitespace-normal break-words">
                {hint}
              </TooltipContent>
            </Tooltip>
          ) : null}
        </div>
        {icon ? (
          <div className={cn("rounded-lg border border-border/50 p-2 shadow-sm", toneStyle.icon)}>
            {icon}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
