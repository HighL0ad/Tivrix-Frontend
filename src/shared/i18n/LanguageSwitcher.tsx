import { Check, Globe2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { apiRequest } from "@/shared/api/http";
import { queryClient } from "@/shared/api/query-client";
import {
  localeFlags,
  localeNames,
  supportedLocales,
  type AppLocale,
} from "@/shared/i18n/resources";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

export function LanguageSwitcher({
  className,
  align = "end",
}: {
  className?: string;
  align?: "start" | "center" | "end";
}) {
  const { i18n, t } = useTranslation();
  const activeLocale = i18n.resolvedLanguage as AppLocale;

  async function changeLocale(locale: AppLocale) {
    if (locale === activeLocale) {
      return;
    }

    await apiRequest<{
      locale: AppLocale;
      default_locale: AppLocale;
      supported_locales: AppLocale[];
    }>("/api/locale", {
      method: "POST",
      json: { lang: locale },
    });
    await i18n.changeLanguage(locale);
    queryClient.invalidateQueries();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "text-base hover:bg-white/10 hover:text-white",
            className,
          )}
          aria-label={t("app.language")}
          title={t("app.language")}
        >
          <span aria-hidden="true">{localeFlags[activeLocale]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="min-w-48">
        {supportedLocales.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => changeLocale(locale)}
            className="justify-between"
          >
            <span className="flex items-center gap-2">
              <span aria-hidden="true">{localeFlags[locale]}</span>
              <span>{localeNames[locale]}</span>
            </span>
            {activeLocale === locale ? (
              <Check className="size-4 text-primary" aria-hidden="true" />
            ) : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function LanguageSegmentedSwitcher({ className }: { className?: string }) {
  const { i18n } = useTranslation();
  const activeLocale = i18n.resolvedLanguage as AppLocale;

  async function changeLocale(locale: AppLocale) {
    if (locale === activeLocale) {
      return;
    }

    await apiRequest<{
      locale: AppLocale;
      default_locale: AppLocale;
      supported_locales: AppLocale[];
    }>("/api/locale", {
      method: "POST",
      json: { lang: locale },
    });
    await i18n.changeLanguage(locale);
    queryClient.invalidateQueries();
  }

  return (
    <div
      className={cn(
        "inline-flex rounded-md border border-white/10 bg-white/[0.04] p-0.5",
        className,
      )}
    >
      {supportedLocales.map((locale) => (
        <button
          key={locale}
          type="button"
          onClick={() => changeLocale(locale)}
          className={cn(
            "h-7 min-w-9 rounded px-2 text-xs font-bold text-slate-400 transition-colors hover:text-white",
            activeLocale === locale && "bg-white/10 text-white",
          )}
          aria-pressed={activeLocale === locale}
        >
          {locale.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

export function LanguageRow({ className }: { className?: string }) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 px-3 py-2.5 text-sm text-slate-300",
        className,
      )}
    >
      <span className="flex min-w-0 items-center gap-2 font-semibold">
        <Globe2 className="size-4 text-slate-500" aria-hidden="true" />
        <span>{t("app.language")}</span>
      </span>
      <LanguageSegmentedSwitcher />
    </div>
  );
}
