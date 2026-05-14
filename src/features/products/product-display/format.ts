import { format } from "date-fns";
import { az } from "date-fns/locale";

import { i18n } from "@/shared/i18n";

export function formatProductDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return format(new Date(value), "dd.MM.yyyy HH:mm", { locale: az });
}

export function getRegistrationLabel(status: string) {
  return i18n.t(`products.registrationStatus.${status}`, { defaultValue: status });
}

export function getSaleSourceLabel(source: string | null) {
  return source ? i18n.t(`products.saleSource.${source}`, { defaultValue: source }) : "-";
}
