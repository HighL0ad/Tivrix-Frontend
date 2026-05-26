import { i18n } from "@/shared/i18n";

export function walletTypeLabel(type: string | null | undefined) {
  const normalizedType = normalizeWalletType(type);
  if (!normalizedType) return i18n.t("walletTypes.unknown");
  return i18n.t(`walletTypes.${normalizedType}`, { defaultValue: normalizedType });
}

export function walletNameLabel(name: string | null | undefined) {
  if (!name) return "";
  return i18n.t(`walletNames.${name}`, { defaultValue: name });
}

export function walletTypeOptions<T extends { value: string; label: string }>(
  options: T[],
) {
  return options.map((option) => ({
    id: option.value,
    name: walletTypeLabel(option.value),
  }));
}

function normalizeWalletType(type: string | null | undefined) {
  if (!type) return null;
  const normalizedType = type.toLowerCase().split(".").pop() ?? type.toLowerCase();
  const aliases: Record<string, string> = {
    bank_card: "card",
    partner_shop: "shop",
  };

  return aliases[normalizedType] ?? normalizedType;
}
