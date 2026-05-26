import { format } from "date-fns";
import { az } from "date-fns/locale";

import { i18n } from "@/shared/i18n";

const legacyInstallmentSource = "legacy_installment_import";
const legacyCreditImeiPrefix = "LEGACY-CREDIT-";

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

export function isLegacyInstallmentProduct(product: {
  imei?: string | null;
  current_sale?: unknown;
}) {
  return (
    getSaleSource(product.current_sale) === legacyInstallmentSource ||
    product.imei?.startsWith(legacyCreditImeiPrefix) === true
  );
}

export function formatProductImei(product: {
  imei: string;
  imei2?: string | null;
  current_sale?: unknown;
}) {
  if (isLegacyInstallmentProduct(product)) {
    return i18n.t("products.legacyInstallmentServiceRecord");
  }

  return `IMEI: ${product.imei}${product.imei2 ? ` / ${product.imei2}` : ""}`;
}

export function formatProductSupplier(product: {
  supplier_name?: string | null;
  imei?: string | null;
  current_sale?: unknown;
}) {
  if (isLegacyInstallmentProduct(product)) {
    return i18n.t("products.legacyInstallmentSupplier");
  }

  return product.supplier_name ?? "-";
}

function getSaleSource(sale: unknown) {
  if (!sale || typeof sale !== "object" || !("source" in sale)) {
    return null;
  }

  const source = (sale as { source?: unknown }).source;
  return typeof source === "string" ? source : null;
}
