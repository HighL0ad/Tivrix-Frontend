import type { ProductDetail } from "@/entities/products/model/types";
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
  return (
    <Card className="bg-muted/40">
      <CardHeader>
        <CardTitle className="text-base">Данные покупателя</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <SaleRow label="Имя клиента" value={sale.client_name ?? "Не указано"} />
        <SaleRow label="Телефон" value={sale.client_phone ?? "-"} />
        <SaleRow label="Источник" value={getSaleSourceLabel(sale.source)} />
        <SaleRow label="Цена продажи" value={`${sale.total_price} ₼`} strong />
        <SaleRow
          label="Чистая прибыль"
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
              alt="Фото подтверждения"
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
