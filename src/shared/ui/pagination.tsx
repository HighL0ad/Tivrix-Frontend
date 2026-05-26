import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  const { t } = useTranslation();

  return (
    <nav
      data-slot="pagination"
      aria-label={t("common.pagination")}
      className={cn("flex min-w-fit justify-start sm:justify-end", className)}
      {...props}
    />
  );
}

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex flex-wrap items-center gap-2", className)}
      {...props}
    />
  );
}

function PaginationItem({ className, ...props }: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" className={cn(className)} {...props} />;
}

function PaginationPrevious({
  className,
  ...props
}: React.ComponentProps<"button">) {
  const { t } = useTranslation();

  return (
    <Button
      data-slot="pagination-previous"
      type="button"
      variant="outline"
      size="sm"
      className={cn("gap-1", className)}
      {...props}
    >
      <ChevronLeft aria-hidden="true" />
      <span>{t("common.back")}</span>
    </Button>
  );
}

function PaginationNext({
  className,
  ...props
}: React.ComponentProps<"button">) {
  const { t } = useTranslation();

  return (
    <Button
      data-slot="pagination-next"
      type="button"
      variant="outline"
      size="sm"
      className={cn("gap-1", className)}
      {...props}
    >
      <span>{t("common.next")}</span>
      <ChevronRight aria-hidden="true" />
    </Button>
  );
}

function PaginationBar({
  page,
  totalPages,
  total,
  totalLabel,
  onPageChange,
  className,
}: {
  page: number;
  totalPages: number;
  total?: number;
  totalLabel?: string;
  onPageChange: (page: number) => void;
  className?: string;
}) {
  const { t } = useTranslation();
  const normalizedTotalPages = Math.max(1, totalPages);

  return (
    <div
      className={cn(
        "mt-4 flex flex-col gap-3 border-t pt-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex h-9 items-center rounded-md border bg-background px-3 font-semibold text-foreground">
          {t("common.pageOf", { page, total: normalizedTotalPages })}
        </span>
        {total !== undefined ? (
          <span className="text-muted-foreground">
            {totalLabel ?? t("common.totalFound", { count: total })}
          </span>
        ) : null}
      </div>
      <Pagination className="shrink-0">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              disabled={page <= 1}
              onClick={() => onPageChange(Math.max(1, page - 1))}
            />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              disabled={page >= normalizedTotalPages}
              onClick={() => onPageChange(Math.min(normalizedTotalPages, page + 1))}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}

export {
  Pagination,
  PaginationBar,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
};
