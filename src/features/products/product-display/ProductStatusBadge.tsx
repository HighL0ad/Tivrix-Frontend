import { Archive, CheckCircle2, Clock3, PackageCheck, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { ProductStatus } from "@/entities/products/model/types";
import { Badge } from "@/shared/ui/badge";

import { formatProductDate } from "./format";

export function ProductStatusBadge({
  status,
  soldAt,
}: {
  status: ProductStatus;
  soldAt?: string | null;
}) {
  const { t } = useTranslation();
  const statusMeta: Record<ProductStatus, { label: string; className: string; icon: typeof PackageCheck }> =
    {
      new: {
        label: t("products.status.new"),
        className: "border-sky-200 bg-sky-50 text-sky-800",
        icon: Archive,
      },
      in_stock: {
        label: t("products.status.in_stock"),
        className: "border-emerald-200 bg-emerald-50 text-emerald-800 shadow-sm",
        icon: PackageCheck,
      },
      sold: {
        label: soldAt ? t("products.status.soldWithDate", { date: formatProductDate(soldAt) }) : t("products.status.sold"),
        className: "border-violet-200 bg-violet-50 text-violet-800 shadow-sm",
        icon: CheckCircle2,
      },
      reserved: {
        label: t("products.status.reserved"),
        className: "border-amber-200 bg-amber-50 text-amber-800 shadow-sm",
        icon: Clock3,
      },
      returned: {
        label: t("products.status.returned"),
        className: "border-rose-200 bg-rose-50 text-rose-800",
        icon: RotateCcw,
      },
    };
  const meta = statusMeta[status];
  const Icon = meta.icon;

  return (
    <Badge variant="outline" className={`gap-1.5 ${meta.className}`}>
      <Icon className="size-3.5" aria-hidden="true" />
      {meta.label}
    </Badge>
  );
}
