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

export {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
};
