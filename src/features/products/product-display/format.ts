import { format } from "date-fns";
import { az } from "date-fns/locale";

export function formatProductDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return format(new Date(value), "dd.MM.yyyy HH:mm", { locale: az });
}

export function getRegistrationLabel(status: string) {
  const labels: Record<string, string> = {
    registered: "Зарегистрирован",
    unregistered: "Без регистрации",
    no_declaration: "Без декларации",
    own_property: "Собственность",
    credit: "Кредитный",
    mismatch: "Несоответствие",
  };

  return labels[status] ?? status;
}

export function getSaleSourceLabel(source: string | null) {
  const labels: Record<string, string> = {
    instagram: "Instagram",
    tap_az: "Tap.az",
    lalafo: "Lalafo",
    recommendation: "Рекомендация",
    passing_by: "Проходил мимо",
    regular: "Постоянный клиент",
  };

  return source ? labels[source] ?? source : "-";
}
