export function money(value: string | number | null | undefined) {
  const amount = Number(value ?? 0);
  return `${amount.toLocaleString("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ₼`;
}

export function shortDate(value: string | null | undefined) {
  if (!value) {
    return "—";
  }
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function relativeDate(value: string | null | undefined, t: (key: string) => string) {
  if (!value) return "—";
  
  const date = new Date(value);
  const now = new Date();
  
  // Reset time for comparison
  const dDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const diffTime = dDate.getTime() - dNow.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return t("common.today");
  if (diffDays === 1) return t("common.tomorrow");
  if (diffDays === -1) return t("common.yesterday");
  
  if (diffDays > 1 && diffDays < 7) return t("common.inNDays").replace("{n}", String(diffDays));
  if (diffDays < -1 && diffDays > -7) return t("common.nDaysAgo").replace("{n}", String(Math.abs(diffDays)));

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(date);
}
