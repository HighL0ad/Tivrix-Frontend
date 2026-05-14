import { i18n } from "@/shared/i18n";

export type PurchaseScenario = "supplier_debt" | "cash_now" | "transfer_now";

export const registrationOptions = [
  { value: "registered", labelKey: "products.registrationStatus.registered" },
  { value: "unregistered", labelKey: "products.registrationStatus.unregistered" },
  { value: "no_declaration", labelKey: "products.registrationStatus.no_declaration" },
  { value: "own_property", labelKey: "products.registrationStatus.own_property" },
  { value: "credit", labelKey: "products.registrationStatus.credit" },
  { value: "mismatch", labelKey: "products.registrationStatus.mismatch" },
];

export const productStatusOptions = [
  { value: "in_stock", labelKey: "products.status.inStockForm" },
  { value: "reserved", labelKey: "products.status.reservedForm" },
  { value: "sold", labelKey: "products.status.sold" },
];

export const scenarioMeta: Record<
  PurchaseScenario,
  { titleKey: string; descriptionKey: string }
> = {
  supplier_debt: {
    titleKey: "products.scenario.supplierDebt.title",
    descriptionKey: "products.scenario.supplierDebt.description",
  },
  cash_now: {
    titleKey: "products.scenario.cashNow.title",
    descriptionKey: "products.scenario.cashNow.description",
  },
  transfer_now: {
    titleKey: "products.scenario.transferNow.title",
    descriptionKey: "products.scenario.transferNow.description",
  },
};

export function getPaymentMethod(scenario: PurchaseScenario) {
  if (scenario === "supplier_debt") return "debt";
  if (scenario === "cash_now") return "cash";
  return "card";
}

export function getProductFormErrorMessage(
  payload: unknown,
  fallback = i18n.t("products.saveError"),
) {
  if (
    payload &&
    typeof payload === "object" &&
    "detail" in payload &&
    typeof payload.detail === "string"
  ) {
    return payload.detail;
  }
  return fallback;
}
