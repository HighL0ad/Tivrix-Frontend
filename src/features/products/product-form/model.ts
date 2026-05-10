export type PurchaseScenario = "supplier_debt" | "cash_now" | "transfer_now";

export const registrationOptions = [
  { value: "registered", label: "Зарегистрирован" },
  { value: "unregistered", label: "Без регистрации" },
  { value: "no_declaration", label: "Без декларации" },
  { value: "own_property", label: "Собственность" },
  { value: "credit", label: "Кредитный" },
  { value: "mismatch", label: "Несоответствие" },
];

export const productStatusOptions = [
  { value: "in_stock", label: "В наличии" },
  { value: "reserved", label: "В резерве" },
  { value: "sold", label: "Продан" },
];

export const scenarioMeta: Record<
  PurchaseScenario,
  { title: string; description: string }
> = {
  supplier_debt: {
    title: "Взяли у поставщика в долг",
    description: "Товар пришёл сейчас, оплату поставщику закроем позже.",
  },
  cash_now: {
    title: "Основная оплата наличными",
    description: "Основная сумма будет списана из кассы.",
  },
  transfer_now: {
    title: "Основная оплата переводом",
    description: "Выберите карту или счёт для основной суммы.",
  },
};

export function getPaymentMethod(scenario: PurchaseScenario) {
  if (scenario === "supplier_debt") return "debt";
  if (scenario === "cash_now") return "cash";
  return "card";
}

export function getProductFormErrorMessage(
  payload: unknown,
  fallback = "Ошибка сохранения",
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
