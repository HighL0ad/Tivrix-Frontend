import type { ReactNode } from "react";

import { cn } from "@/shared/lib/utils";
import { Separator } from "@/shared/ui/separator";

export function PageHeader({
  title,
  description,
  actions,
  className,
  backButton,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
  backButton?: ReactNode;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      {backButton ? (
        <div className="flex items-center">
          {backButton}
        </div>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-2xl font-black tracking-tight text-gray-950">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 max-w-2xl text-[13px] leading-5 text-gray-500">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex w-full shrink-0 flex-wrap gap-2 sm:w-auto">
            {actions}
          </div>
        ) : null}
      </div>
      <Separator />
    </div>
  );
}
