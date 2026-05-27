import React from "react";

export function HighlightText({ text, highlight }: { text: string | null; highlight: string }) {
  if (!text) return <span>—</span>;
  if (!highlight || !highlight.trim()) {
    return <span>{text}</span>;
  }
  const cleanHighlight = highlight.trim();
  const escaped = cleanHighlight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);
  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-amber-100 text-amber-950 font-medium px-0.5 rounded-xs select-all">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
}
