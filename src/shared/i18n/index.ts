import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import {
  defaultLocale,
  resources,
  supportedLocales,
  type AppLocale,
} from "@/shared/i18n/resources";

function getCookie(name: string) {
  const match = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`));

  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null;
}

export function getInitialLocale(): AppLocale {
  const cookieLocale = getCookie("locale");
  if (cookieLocale && supportedLocales.includes(cookieLocale as AppLocale)) {
    return cookieLocale as AppLocale;
  }
  if (typeof navigator !== "undefined") {
    const browserLangs = navigator.languages || [navigator.language];
    for (const lang of browserLangs) {
      if (!lang) continue;
      const code = lang.slice(0, 2).toLowerCase();
      if (supportedLocales.includes(code as AppLocale)) {
        return code as AppLocale;
      }
    }
  }
  return defaultLocale;
}

export function normalizeLocale(locale: string | null | undefined): AppLocale {
  return supportedLocales.includes(locale as AppLocale)
    ? (locale as AppLocale)
    : defaultLocale;
}

i18n.use(initReactI18next).init({
  resources,
  lng: getInitialLocale(),
  fallbackLng: defaultLocale,
  interpolation: {
    escapeValue: false,
  },
});

export { i18n };
