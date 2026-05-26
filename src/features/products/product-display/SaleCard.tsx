import type { ProductDetail } from "@/entities/products/model/types";
import { useTranslation } from "react-i18next";
import { money } from "@/shared/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";

import { getSaleSourceLabel } from "./format";

export function SaleCard({
  sale,
  onPreview,
}: {
  sale: NonNullable<ProductDetail["current_sale"]>;
  onPreview: (image: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <Card className="bg-muted/40">
      <CardHeader>
        <CardTitle className="text-base">{t("products.customerData")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <SaleRow label={t("products.customerName")} value={sale.client_name ?? t("products.notSpecified")} />
        <SaleRow label={t("products.phone")} value={sale.client_phone ?? "-"} />
        <SaleRow label={t("products.source")} value={getSaleSourceLabel(sale.source)} />
        {sale.shop_debt_due_date ? (
          <SaleRow
            label={t("sell.shopDebtDueDate")}
            value={formatDateOnly(sale.shop_debt_due_date)}
          />
        ) : null}
        <SaleRow label={t("products.salePrice")} value={`${sale.total_price} ₼`} strong />
        {sale.sale_mode === "installment" && sale.cash_price ? (
          <SaleRow label={t("sell.baseSalePrice")} value={`${sale.cash_price} ₼`} />
        ) : null}
        <SaleRow
          label={t("products.netProfit")}
          value={signedMoney(sale.profit)}
          tone={Number(sale.profit) >= 0 ? "good" : "bad"}
        />

        {sale.proof_image ? (
          <button
            type="button"
            onClick={() => onPreview(sale.proof_image!)}
            className="mt-3 block h-28 w-full overflow-hidden border bg-background"
          >
            <img
              src={sale.proof_image}
              alt={t("products.proofPhoto")}
              className="h-full w-full object-cover"
            />
          </button>
        ) : null}
      </CardContent>
    </Card>
  );
}

function SaleRow({
  label,
  value,
  strong = false,
  tone,
}: {
  label: string;
  value: string;
  strong?: boolean;
  tone?: "good" | "bad";
}) {
  const toneClass =
    tone === "good"
      ? "text-emerald-600"
      : tone === "bad"
        ? "text-rose-600"
        : "text-foreground";

  return (
    <div className="flex items-center justify-between gap-4 border-b pb-2 last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={`text-right ${strong ? "text-lg font-bold" : "font-medium"} ${
          toneClass
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function signedMoney(value: string | number) {
  const amount = Number(value);
  return `${amount > 0 ? "+" : ""}${money(amount)}`;
}

function formatDateOnly(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(new Date(value));
}
