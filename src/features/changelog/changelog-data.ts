export const CURRENT_CHANGELOG_VERSION = "0.1.5-alpha.1";

export type ChangelogLocale = "ru" | "az";

export type ChangelogItem = {
  version: typeof CURRENT_CHANGELOG_VERSION;
  type: "new" | "update";
  title: Record<ChangelogLocale, string>;
  description: Record<ChangelogLocale, string>;
};

export const changelogItems: ChangelogItem[] = [
  {
    version: CURRENT_CHANGELOG_VERSION,
    type: "new",
    title: {
      ru: "Добавлен Центр помощи",
      az: "Kömək mərkəzi əlavə edildi",
    },
    description: {
      ru: "В Tivrix добавлен Центр помощи.",
      az: "Tivrix-ə Kömək mərkəzi əlavə edildi.",
    },
  },
];

export function getCurrentChangelogItems() {
  return changelogItems.filter((item) => item.version === CURRENT_CHANGELOG_VERSION);
}

export function getChangelogLocale(language: string): ChangelogLocale {
  return language.startsWith("az") ? "az" : "ru";
}
