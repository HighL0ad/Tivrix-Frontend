import { i18n } from "@/shared/i18n";

export function walletTypeLabel(type: string | null | undefined) {
  if (!type) return i18n.t("walletTypes.unknown");
  return i18n.t(`walletTypes.${type}`, { defaultValue: type });
}

export function walletTypeOptions<T extends { value: string; label: string }>(
  options: T[],
) {
  return options.map((option) => ({
    id: option.value,
    name: walletTypeLabel(option.value),
  }));
}
