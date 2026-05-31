import { ScanSearch } from "lucide-react";

interface PhotoMetadataScanStatusProps {
  text: string;
}

export function PhotoMetadataScanStatus({
  text,
}: PhotoMetadataScanStatusProps) {
  return (
    <div
      className="mt-3 inline-flex items-center gap-2 rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-[13px] font-semibold leading-5 text-sky-700 shadow-sm"
      aria-live="polite"
    >
      <span className="relative flex size-5 items-center justify-center">
        <span className="absolute size-5 rounded-full bg-sky-400/20 motion-safe:animate-ping" />
        <ScanSearch className="relative size-4 text-sky-600" />
      </span>
      <span>{text}</span>
      <span className="flex items-end gap-0.5 text-sky-500" aria-hidden="true">
        <span className="motion-safe:animate-bounce">.</span>
        <span className="motion-safe:animate-bounce [animation-delay:120ms]">.</span>
        <span className="motion-safe:animate-bounce [animation-delay:240ms]">.</span>
      </span>
    </div>
  );
}
