import { cn } from "@/shared/lib/utils";
import { money as formatMoney } from "@/shared/lib/format";

export function Money({
  value,
  className,
  colored = false,
  signed = false,
}: {
  value: string | number | null | undefined;
  className?: string;
  colored?: boolean;
  signed?: boolean;
}) {
  const numValue = Number(value ?? 0);
  const formatted = formatMoney(numValue);
  const displayValue = signed && numValue > 0 ? `+${formatted}` : formatted;

  return (
    <span
      className={cn(
        "font-mono",
        colored && numValue > 0 && "text-emerald-700",
        colored && numValue < 0 && "text-rose-600",
        className,
      )}
    >
      {displayValue}
    </span>
  );
}
