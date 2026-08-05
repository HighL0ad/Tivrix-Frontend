import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  HelpCircle,
  Lightbulb,
  LucideIcon,
  Phone,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Wallet,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router";

import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { cn } from "@/shared/lib/utils";

export interface HelpStep {
  titleKey: string;
  descKey: string;
  tipKey?: string;
  actionUrl?: string;
  actionLabelKey?: string;
}

export interface HelpTopic {
  id: string;
  category: "getting-started" | "imei" | "installments" | "finance" | "users";
  icon: LucideIcon;
  titleKey: string;
  summaryKey: string;
  actionUrl?: string;
  actionLabelKey?: string;
  steps: HelpStep[];
}

export const helpTopics: HelpTopic[] = [
  {
    id: "quick-start",
    category: "getting-started",
    icon: Sparkles,
    titleKey: "help.topics.quickStart.title",
    summaryKey: "help.topics.quickStart.summary",
    actionUrl: "/",
    actionLabelKey: "help.actions.goToDashboard",
    steps: [
      {
        titleKey: "help.topics.quickStart.step1Title",
        descKey: "help.topics.quickStart.step1Desc",
        tipKey: "help.topics.quickStart.step1Tip",
        actionUrl: "/finance",
        actionLabelKey: "help.actions.goToFinance",
      },
      {
        titleKey: "help.topics.quickStart.step2Title",
        descKey: "help.topics.quickStart.step2Desc",
        tipKey: "help.topics.quickStart.step2Tip",
        actionUrl: "/products/new",
        actionLabelKey: "help.actions.addProduct",
      },
      {
        titleKey: "help.topics.quickStart.step3Title",
        descKey: "help.topics.quickStart.step3Desc",
        tipKey: "help.topics.quickStart.step3Tip",
        actionUrl: "/clients",
        actionLabelKey: "help.actions.goToClients",
      },
      {
        titleKey: "help.topics.quickStart.step4Title",
        descKey: "help.topics.quickStart.step4Desc",
        tipKey: "help.topics.quickStart.step4Tip",
        actionUrl: "/users",
        actionLabelKey: "help.actions.goToUsers",
      },
    ],
  },
  {
    id: "imei-management",
    category: "imei",
    icon: Phone,
    titleKey: "help.topics.imei.title",
    summaryKey: "help.topics.imei.summary",
    actionUrl: "/products/new",
    actionLabelKey: "help.actions.addProduct",
    steps: [
      {
        titleKey: "help.topics.imei.step1Title",
        descKey: "help.topics.imei.step1Desc",
        tipKey: "help.topics.imei.step1Tip",
        actionUrl: "/products/new",
        actionLabelKey: "help.actions.addProduct",
      },
      {
        titleKey: "help.topics.imei.step2Title",
        descKey: "help.topics.imei.step2Desc",
        tipKey: "help.topics.imei.step2Tip",
        actionUrl: "/products",
        actionLabelKey: "help.actions.goToProducts",
      },
      {
        titleKey: "help.topics.imei.step3Title",
        descKey: "help.topics.imei.step3Desc",
        tipKey: "help.topics.imei.step3Tip",
        actionUrl: "/products?status=in_stock",
        actionLabelKey: "help.actions.goToStock",
      },
    ],
  },
  {
    id: "installment-system",
    category: "installments",
    icon: CreditCard,
    titleKey: "help.topics.installments.title",
    summaryKey: "help.topics.installments.summary",
    actionUrl: "/debts",
    actionLabelKey: "help.actions.goToDebts",
    steps: [
      {
        titleKey: "help.topics.installments.step1Title",
        descKey: "help.topics.installments.step1Desc",
        tipKey: "help.topics.installments.step1Tip",
        actionUrl: "/clients",
        actionLabelKey: "help.actions.goToClients",
      },
      {
        titleKey: "help.topics.installments.step2Title",
        descKey: "help.topics.installments.step2Desc",
        tipKey: "help.topics.installments.step2Tip",
        actionUrl: "/debts",
        actionLabelKey: "help.actions.goToDebts",
      },
      {
        titleKey: "help.topics.installments.step3Title",
        descKey: "help.topics.installments.step3Desc",
        tipKey: "help.topics.installments.step3Tip",
        actionUrl: "/debts?tab=overview",
        actionLabelKey: "help.actions.goToDebts",
      },
    ],
  },
  {
    id: "cash-and-finance",
    category: "finance",
    icon: Wallet,
    titleKey: "help.topics.finance.title",
    summaryKey: "help.topics.finance.summary",
    actionUrl: "/finance",
    actionLabelKey: "help.actions.goToFinance",
    steps: [
      {
        titleKey: "help.topics.finance.step1Title",
        descKey: "help.topics.finance.step1Desc",
        tipKey: "help.topics.finance.step1Tip",
        actionUrl: "/catalogs",
        actionLabelKey: "help.actions.goToCatalogs",
      },
      {
        titleKey: "help.topics.finance.step2Title",
        descKey: "help.topics.finance.step2Desc",
        tipKey: "help.topics.finance.step2Tip",
        actionUrl: "/finance?action=adjust",
        actionLabelKey: "help.actions.goToFinance",
      },
      {
        titleKey: "help.topics.finance.step3Title",
        descKey: "help.topics.finance.step3Desc",
        tipKey: "help.topics.finance.step3Tip",
        actionUrl: "/finance?action=transfer",
        actionLabelKey: "help.actions.goToFinance",
      },
    ],
  },
  {
    id: "staff-and-roles",
    category: "users",
    icon: UserCheck,
    titleKey: "help.topics.users.title",
    summaryKey: "help.topics.users.summary",
    actionUrl: "/users",
    actionLabelKey: "help.actions.goToUsers",
    steps: [
      {
        titleKey: "help.topics.users.step1Title",
        descKey: "help.topics.users.step1Desc",
        tipKey: "help.topics.users.step1Tip",
        actionUrl: "/users",
        actionLabelKey: "help.actions.goToUsers",
      },
      {
        titleKey: "help.topics.users.step2Title",
        descKey: "help.topics.users.step2Desc",
        tipKey: "help.topics.users.step2Tip",
        actionUrl: "/users",
        actionLabelKey: "help.actions.goToUsers",
      },
      {
        titleKey: "help.topics.users.step3Title",
        descKey: "help.topics.users.step3Desc",
        tipKey: "help.topics.users.step3Tip",
        actionUrl: "/users",
        actionLabelKey: "help.actions.goToUsers",
      },
    ],
  },
];

export function HelpCenterDialog({
  open,
  onOpenChange,
  initialTopicId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTopicId?: string;
}) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selectedTopic, setSelectedTopic] = useState<HelpTopic | null>(
    helpTopics.find((t) => t.id === initialTopicId) ?? null,
  );
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const handleSelectTopic = (topic: HelpTopic) => {
    setSelectedTopic(topic);
    setCurrentStepIndex(0);
  };

  const handleNextStep = () => {
    if (!selectedTopic) return;
    if (currentStepIndex < selectedTopic.steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const filteredTopics = helpTopics.filter((topic) => {
    const title = t(topic.titleKey).toLowerCase();
    const summary = t(topic.summaryKey).toLowerCase();
    const matchesSearch =
      !search.trim() ||
      title.includes(search.toLowerCase()) ||
      summary.includes(search.toLowerCase());
    const matchesCategory =
      activeCategory === "all" || topic.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const activeStep = selectedTopic ? selectedTopic.steps[currentStepIndex] : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[85vh] w-[94vw] max-w-4xl sm:max-w-4xl flex-col p-0 overflow-hidden sm:rounded-2xl border-border bg-card shadow-2xl">
        {/* Header */}
        <DialogHeader className="border-b bg-muted/40 px-6 py-4 shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-xl bg-sky-500/15 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400 shadow-xs">
                <HelpCircle className="size-6" />
              </span>
              <div>
                <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                  {t("help.title")}
                </DialogTitle>
                <p className="text-xs text-muted-foreground">
                  {t("help.subtitle")}
                </p>
              </div>
            </div>

            {selectedTopic && (
              <div className="hidden sm:flex items-center gap-2 rounded-xl border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                <Sparkles className="size-4 text-sky-500" />
                <span>
                  {t("help.wizardStepProgress", {
                    current: currentStepIndex + 1,
                    total: selectedTopic.steps.length,
                  })}
                </span>
              </div>
            )}
          </div>
        </DialogHeader>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedTopic && activeStep ? (
            /* Interactive Wizard View */
            <div className="space-y-6 max-w-3xl mx-auto">
              {/* Back to Topics List */}
              <div className="flex items-center justify-between border-b pb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTopic(null)}
                  className="gap-2 text-xs font-bold text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="size-4" />
                  {t("help.backToList")}
                </Button>
                <span className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                  {t(selectedTopic.titleKey)}
                </span>
              </div>

              {/* Stepper Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                  <span>
                    {t("help.stepLabel", { number: currentStepIndex + 1 })}
                  </span>
                  <span>
                    {Math.round(
                      ((currentStepIndex + 1) / selectedTopic.steps.length) * 100,
                    )}
                    %
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-linear-to-r from-sky-500 to-indigo-600 transition-all duration-300"
                    style={{
                      width: `${
                        ((currentStepIndex + 1) / selectedTopic.steps.length) * 100
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* Interactive Step Card */}
              <div className="rounded-2xl border bg-card p-6 shadow-md space-y-6">
                <div className="flex items-start gap-4">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white font-bold text-lg shadow-md shadow-sky-900/30">
                    {currentStepIndex + 1}
                  </span>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-foreground">
                      {t(activeStep.titleKey)}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {t(activeStep.descKey)}
                    </p>
                  </div>
                </div>

                {/* Pro-Tip Box if present */}
                {activeStep.tipKey && (
                  <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs font-medium text-amber-950 dark:text-amber-200">
                    <Lightbulb className="size-5 shrink-0 text-amber-500" />
                    <div className="space-y-1">
                      <span className="font-bold block uppercase text-[10px] tracking-wider text-amber-600 dark:text-amber-400">
                        {t("help.proTip")}
                      </span>
                      <p className="leading-relaxed">{t(activeStep.tipKey)}</p>
                    </div>
                  </div>
                )}

                {/* Direct Action Link for this step */}
                {activeStep.actionUrl && (
                  <div className="pt-2">
                    <Button
                      asChild
                      variant="outline"
                      className="gap-2 border-sky-400/40 text-sky-600 hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-950/40"
                    >
                      <NavLink
                        to={activeStep.actionUrl}
                        onClick={() => onOpenChange(false)}
                      >
                        {t(activeStep.actionLabelKey ?? "common.open")}
                        <ChevronRight className="size-4" />
                      </NavLink>
                    </Button>
                  </div>
                )}
              </div>

              {/* Wizard Bottom Controls */}
              <div className="flex items-center justify-between border-t pt-4">
                <Button
                  variant="outline"
                  onClick={handlePrevStep}
                  disabled={currentStepIndex === 0}
                  className="gap-1.5 text-xs font-semibold"
                >
                  <ArrowLeft className="size-4" />
                  {t("help.prevStep")}
                </Button>

                <div className="flex items-center gap-1.5">
                  {selectedTopic.steps.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentStepIndex(idx)}
                      className={cn(
                        "size-3 rounded-full transition-all",
                        idx === currentStepIndex
                          ? "bg-sky-600 w-8"
                          : "bg-muted hover:bg-sky-400/50",
                      )}
                    />
                  ))}
                </div>

                {currentStepIndex < selectedTopic.steps.length - 1 ? (
                  <Button
                    onClick={handleNextStep}
                    className="gap-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold"
                  >
                    {t("help.nextStep")}
                    <ArrowRight className="size-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={() => onOpenChange(false)}
                    className="gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                  >
                    <Check className="size-4" />
                    {t("help.finishWizard")}
                  </Button>
                )}
              </div>
            </div>
          ) : (
            /* Topics Grid List View */
            <div className="space-y-6">
              {/* Search & Categories Bar */}
              <div className="space-y-4">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t("help.searchPlaceholder")}
                    className="pl-10 h-11 text-sm bg-background border-border shadow-xs"
                  />
                </div>

                <Tabs value={activeCategory} onValueChange={setActiveCategory}>
                  <TabsList className="w-full justify-start overflow-x-auto no-scrollbar">
                    <TabsTrigger value="all">{t("common.all")}</TabsTrigger>
                    <TabsTrigger value="getting-started">{t("help.categories.quickStart")}</TabsTrigger>
                    <TabsTrigger value="imei">{t("help.categories.imei")}</TabsTrigger>
                    <TabsTrigger value="installments">{t("help.categories.installments")}</TabsTrigger>
                    <TabsTrigger value="finance">{t("help.categories.finance")}</TabsTrigger>
                    <TabsTrigger value="users">{t("help.categories.users")}</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Topics Grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredTopics.map((topic) => {
                  const Icon = topic.icon;
                  return (
                    <div
                      key={topic.id}
                      onClick={() => handleSelectTopic(topic)}
                      className="group flex flex-col justify-between rounded-2xl border bg-card p-5 transition-all hover:border-sky-500/50 hover:shadow-lg cursor-pointer"
                    >
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="flex size-12 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400 group-hover:scale-110 transition-transform">
                            <Icon className="size-6" />
                          </span>
                          <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold text-muted-foreground">
                            {t("help.stepCount", { count: topic.steps.length })}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-bold text-foreground text-base group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                            {t(topic.titleKey)}
                          </h3>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1.5 leading-relaxed">
                            {t(topic.summaryKey)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t flex items-center justify-between text-xs font-bold text-sky-600 dark:text-sky-400">
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="size-3.5" />
                          {t("help.startWizard")}
                        </span>
                        <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
