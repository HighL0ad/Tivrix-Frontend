import type { ReactNode } from "react";

export function DetailItem({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="grid grid-cols-[auto_1fr] gap-3">
      <div className="mt-0.5 text-muted-foreground [&_svg]:size-4">{icon}</div>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="mt-1 font-medium text-foreground">{value}</div>
      </div>
    </div>
  );
}
