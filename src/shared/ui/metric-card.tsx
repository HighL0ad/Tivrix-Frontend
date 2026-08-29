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
  const iconTone = {
    neutral: "text-muted-foreground",
    good: "text-success",
    bad: "text-destructive",
    info: "text-info",
    warning: "text-warning",
    violet: "text-primary",
  }[tone];

  return (
    <Card
      size="sm"
      className="border-border bg-card text-card-foreground shadow-none"
    >
      <CardContent className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="min-h-10 text-sm font-medium leading-5 text-muted-foreground">
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
              compact ? "text-xl" : "text-2xl",
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
          <div className={cn("shrink-0 [&_svg]:size-5", iconTone)}>
            {icon}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
