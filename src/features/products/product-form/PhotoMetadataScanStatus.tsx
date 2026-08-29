import { ScanSearch } from "lucide-react";

interface PhotoMetadataScanStatusProps {
  text: string;
}

export function PhotoMetadataScanStatus({
  text,
}: PhotoMetadataScanStatusProps) {
  return (
    <div
      className="mt-3 inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-[13px] font-semibold leading-5 text-foreground"
      aria-live="polite"
    >
      <ScanSearch className="size-4 shrink-0 text-sky-600" />
      <span>{text}</span>
    </div>
  );
}
