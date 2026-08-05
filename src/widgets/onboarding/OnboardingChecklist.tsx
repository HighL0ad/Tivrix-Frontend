import { useState } from "react";
import {
  CheckCircle2,
  ChevronRight,
  Circle,
  HelpCircle,
  Phone,
  Rocket,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Wallet,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router";

import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { HelpCenterDialog } from "@/features/help/HelpCenterDialog";
import { cn } from "@/shared/lib/utils";

export interface OnboardingChecklistProps {
  hasProducts: boolean;
  hasClients: boolean;
  hasUsers: boolean;
  hasWallets: boolean;
  onStartTour?: () => void;
}

export function OnboardingChecklist({
  hasProducts,
  hasClients,
  hasUsers,
  hasWallets,
  onStartTour,
}: OnboardingChecklistProps) {
  const { t } = useTranslation();
  const [isDismissed, setIsDismissed] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [selectedHelpTopic, setSelectedHelpTopic] = useState<string>("quick-start");

  if (isDismissed) return null;

  const steps = [
    {
      id: "wallets",
      titleKey: "onboarding.step1Title",
      descKey: "onboarding.step1Desc",
      completed: hasWallets,
      url: "/finance",
      helpTopicId: "cash-and-finance",
      icon: Wallet,
    },
    {
      id: "products",
      titleKey: "onboarding.step2Title",
      descKey: "onboarding.step2Desc",
      completed: hasProducts,
      url: "/products/new",
      helpTopicId: "imei-management",
      icon: Phone,
    },
    {
      id: "clients",
      titleKey: "onboarding.step3Title",
      descKey: "onboarding.step3Desc",
      completed: hasClients,
      url: "/clients",
      helpTopicId: "installment-system",
      icon: UserCheck,
    },
    {
      id: "users",
      titleKey: "onboarding.step4Title",
      descKey: "onboarding.step4Desc",
      completed: hasUsers,
      url: "/users",
      helpTopicId: "staff-and-roles",
      icon: ShieldCheck,
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  if (completedCount === steps.length) {
    return null; // All done!
  }

  const openGuide = (topicId: string) => {
    setSelectedHelpTopic(topicId);
    setHelpOpen(true);
  };

  return (
    <>
      <Card className="relative overflow-hidden border-sky-500/30 bg-linear-to-r from-sky-500/10 via-indigo-500/5 to-transparent shadow-md">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-sky-600 text-white shadow-md shadow-sky-900/30">
              <Rocket className="size-5" />
            </span>
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                {t("onboarding.title")}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {t("onboarding.subtitle", { percent: progressPercent })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onStartTour && (
              <Button
                variant="outline"
                size="sm"
                onClick={onStartTour}
                className="h-8 gap-1.5 border-sky-500/40 bg-sky-500/10 text-xs font-bold text-sky-600 hover:bg-sky-500/20 dark:text-sky-400"
              >
                <Sparkles className="size-3.5 text-sky-500" />
                {t("help.startTour")}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => openGuide("quick-start")}
              className="h-8 gap-1.5 border-sky-300/40 bg-background text-xs font-semibold text-sky-600 hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-950/40"
            >
              <HelpCircle className="size-3.5" />
              {t("help.title")}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDismissed(true)}
              className="size-8 text-muted-foreground hover:text-foreground"
              title={t("common.close")}
            >
              <X className="size-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-2">
          {/* Progress Bar */}
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-linear-to-r from-sky-500 to-indigo-600 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.id}
                  className={cn(
                    "flex flex-col justify-between rounded-xl border p-3.5 transition-all",
                    step.completed
                      ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-950 dark:text-emerald-200"
                      : "border-border bg-card hover:border-sky-500/40",
                  )}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          "flex size-8 items-center justify-center rounded-lg text-xs font-bold",
                          step.completed
                            ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        <Icon className="size-4" />
                      </span>
                      {step.completed ? (
                        <CheckCircle2 className="size-5 text-emerald-500" />
                      ) : (
                        <Circle className="size-5 text-muted-foreground/40" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground">
                        {t(step.titleKey)}
                      </h4>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                        {t(step.descKey)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t pt-2">
                    <button
                      onClick={() => openGuide(step.helpTopicId)}
                      className="text-[11px] font-semibold text-sky-600 hover:underline dark:text-sky-400"
                    >
                      {t("help.readGuide")}
                    </button>
                    {!step.completed && (
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-[11px] font-bold text-foreground hover:bg-sky-500/10"
                      >
                        <NavLink to={step.url}>
                          {t("common.open")}
                          <ChevronRight className="size-3 ml-0.5" />
                        </NavLink>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <HelpCenterDialog
        open={helpOpen}
        onOpenChange={setHelpOpen}
        initialTopicId={selectedHelpTopic}
      />
    </>
  );
}
