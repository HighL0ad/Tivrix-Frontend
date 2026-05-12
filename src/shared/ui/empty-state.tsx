import type { ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-dashed border-border bg-muted/20 px-6 py-10 text-center",
        className,
      )}
    >
      <div className="text-base font-bold text-foreground">{title}</div>
      <div className="mt-2 text-[13px] leading-5 text-gray-500">{description}</div>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
