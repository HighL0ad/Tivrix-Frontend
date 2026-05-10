const walletTypeLabels: Record<string, string> = {
  cash: "Наличные",
  card: "Карта / счёт",
  bank_account: "Банковский счёт",
  employee: "Сотрудник",
  client_debt: "Клиент должен",
  debt: "Мы должны поставщику",
  debt_supplier: "Мы должны поставщику",
  shop: "Партнёр / поставщик",
  partner: "Партнёр / поставщик",
  supplier: "Поставщик",
  market: "Маркетплейс",
};

export function walletTypeLabel(type: string | null | undefined) {
  if (!type) return "Не указан";
  return walletTypeLabels[type] ?? type;
}

export function walletTypeOptions<T extends { value: string; label: string }>(
  options: T[],
) {
  return options.map((option) => ({
    id: option.value,
    name: walletTypeLabel(option.value),
  }));
}
