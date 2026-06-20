export const CURRENT_CHANGELOG_VERSION = "0.1.4-alpha.1";

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
    type: "update",
    title: {
      ru: "Карточки аналитики расходов",
      az: "Xərc analitikası kartları",
    },
    description: {
      ru: "Раздел расходов получил такие же сводные карточки, как прибыль: сегодня, неделя, месяц, всё время, выбранный период, средний расход и количество операций.",
      az: "Xərclər bölməsinə mənfəətdə olduğu kimi xülasə kartları əlavə edildi: bugün, həftə, ay, bütün dövr, seçilmiş dövr, orta xərc və əməliyyat sayı.",
    },
  },
];

export function getCurrentChangelogItems() {
  return changelogItems.filter((item) => item.version === CURRENT_CHANGELOG_VERSION);
}

export function getChangelogLocale(language: string): ChangelogLocale {
  return language.startsWith("az") ? "az" : "ru";
}
