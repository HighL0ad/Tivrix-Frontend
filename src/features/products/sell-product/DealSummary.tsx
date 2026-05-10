import { toNumber } from "@/features/products/sell-product/lib";

export function DealSummary({
  saleType,
  totalPrice,
  paidNowTotal,
  shopDebt,
  registrationFee,
}: {
  saleType: "client" | "shop";
  totalPrice: string;
  paidNowTotal: string;
  shopDebt: number;
  registrationFee: number;
}) {
  const total = toNumber(totalPrice);
  const paid =
    saleType === "client" ? toNumber(paidNowTotal) : total - shopDebt;
  const debt = saleType === "client" ? Math.max(total - paid, 0) : shopDebt;

  return (
    <div className="space-y-2 border bg-muted/40 p-3 text-xs">
      <SummaryRow label="Цена продажи" value={`${total.toFixed(2)} ₼`} />
      <SummaryRow label="Получено сейчас" value={`${paid.toFixed(2)} ₼`} />
      <SummaryRow label="Записано в долг" value={`${debt.toFixed(2)} ₼`} />
      {registrationFee > 0 ? (
        <SummaryRow
          label="Регистрация отдельным долгом"
          value={`${registrationFee.toFixed(2)} ₼`}
        />
      ) : null}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
