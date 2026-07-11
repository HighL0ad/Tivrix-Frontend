import { Landmark } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { useSettings, useUpdateSettings } from "@/entities/settings/api/use-settings";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { PageHeader } from "@/shared/ui/page-header";
import { PageError, PageLoading } from "@/shared/ui/page-state";

export function SettingsPage() {
  const { t } = useTranslation();
  const { data: settings, isLoading, isError } = useSettings();
  const updateSettings = useUpdateSettings();

  const [creditEnabled, setCreditEnabled] = useState(true);

  useEffect(() => {
    if (settings) {
      setCreditEnabled(settings.credit_system_enabled);
    }
  }, [settings]);

  if (isLoading) {
    return <PageLoading />;
  }

  if (isError || !settings) {
    return <PageError />;
  }

  const handleSave = () => {
    updateSettings.mutate(
      { credit_system_enabled: creditEnabled },
      {
        onSuccess: () => {
          toast.success(t("settings.updated"));
        },
        onError: () => {
          toast.error(t("products.saveError") || "Error saving settings");
        },
      },
    );
  };

  const isAllowed = settings.credit_system_allowed ?? true;
  const effectiveCreditEnabled = isAllowed ? creditEnabled : false;

  return (
    <section className="space-y-5">
      <PageHeader title={t("settings.title")} description={t("settings.description")} />

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>{t("app.nav.settings")}</CardTitle>
            <CardDescription>{t("settings.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start justify-between gap-4 rounded-xl border border-border p-4 bg-card/50">
              <div className="flex gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600">
                  <Landmark className="size-5" />
                </span>
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-foreground">
                    {t("settings.creditSystem")}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-normal max-w-md">
                    {t("settings.creditSystemDescription")}
                  </p>
                  {!isAllowed && (
                    <p className="mt-1.5 text-[11px] font-bold text-rose-500">
                      {t("settings.disabledBySystemAdmin")}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                disabled={!isAllowed}
                onClick={() => setCreditEnabled(!creditEnabled)}
                className={cn(
                  "flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  effectiveCreditEnabled ? "bg-primary" : "bg-muted-foreground/30",
                  isAllowed ? "cursor-pointer" : "cursor-not-allowed opacity-50",
                )}
                aria-label={t("settings.creditSystem")}
              >
                <span
                  className={cn(
                    "pointer-events-none block size-5 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ease-in-out",
                    effectiveCreditEnabled ? "translate-x-5" : "translate-x-0",
                  )}
                />
              </button>
            </div>

            <div className="flex justify-end pt-4 border-t border-border">
              <Button
                onClick={handleSave}
                disabled={
                  updateSettings.isPending ||
                  creditEnabled === settings.credit_system_enabled
                }
                className="font-semibold"
              >
                {t("settings.save")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
