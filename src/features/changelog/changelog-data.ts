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
      ru: "Центр помощи и интерактивные туры",
      az: "Kömək mərkəzi və interaktiv turlar",
    },
    description: {
      ru: "Добавлены пошаговые инструкции с подсветкой реальных кнопок и разделов интерфейса: товары, IMEI, рассрочки, финансы, сотрудники и справочники.",
      az: "Məhsullar, IMEI, təksitlər, maliyyə, əməkdaşlar və soraqçalar üçün real düymə və bölmələri işıqlandıran addım-addım təlimatlar əlavə edildi.",
    },
  },
  {
    version: CURRENT_CHANGELOG_VERSION,
    type: "new",
    title: {
      ru: "Детальный гайд добавления товара",
      az: "Məhsul əlavə etmə üzrə ətraflı təlimat",
    },
    description: {
      ru: "Тур последовательно объясняет все поля закупки: сценарий оплаты, модель, оба IMEI, номер телефона, цену, регистрацию, фото, поставщика, распределение оплаты и итоговую проверку.",
      az: "Tur alış formasındakı bütün sahələri ardıcıl izah edir: ödəniş ssenarisi, model, hər iki IMEI, telefon nömrəsi, qiymət, qeydiyyat, foto, təchizatçı, ödəniş bölgüsü və yekun yoxlama.",
    },
  },
  {
    version: CURRENT_CHANGELOG_VERSION,
    type: "new",
    title: {
      ru: "Перенос действующих данных магазина",
      az: "Mağazanın mövcud məlumatlarının köçürülməsi",
    },
    description: {
      ru: "Новый гайд по справочникам помогает перенести кассы, карты, начальные остатки, поставщиков, клиентов, непогашенные долги и источники продаж без дублей.",
      az: "Yeni soraqça təlimatı kassaları, kartları, ilkin qalıqları, təchizatçıları, müştəriləri, ödənilməmiş borcları və satış mənbələrini dublikat yaratmadan köçürməyə kömək edir.",
    },
  },
  {
    version: CURRENT_CHANGELOG_VERSION,
    type: "update",
    title: {
      ru: "Улучшена навигация по гайдам",
      az: "Təlimatlarda naviqasiya yaxşılaşdırıldı",
    },
    description: {
      ru: "Туры начинаются с нужного пункта бокового меню, автоматически открывают правильные страницы и вкладки, а подсказки и кнопки остаются видимыми на небольших экранах.",
      az: "Turlar yan menyudakı uyğun bölmədən başlayır, düzgün səhifə və bölmələri avtomatik açır, kiçik ekranlarda isə göstəriş və düymələr görünən qalır.",
    },
  },
];

export function getCurrentChangelogItems() {
  return changelogItems.filter((item) => item.version === CURRENT_CHANGELOG_VERSION);
}

export function getChangelogLocale(language: string): ChangelogLocale {
  return language.startsWith("az") ? "az" : "ru";
}
