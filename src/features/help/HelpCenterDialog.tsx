import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  CreditCard,
  HelpCircle,
  Lightbulb,
  PackagePlus,
  type LucideIcon,
  Phone,
  Search,
  SearchX,
  Sparkles,
  UserCheck,
  Wallet,
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

const helpTopics: HelpTopic[] = [
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
    id: "product-create",
    category: "imei",
    icon: PackagePlus,
    titleKey: "help.topics.productCreate.title",
    summaryKey: "help.topics.productCreate.summary",
    actionUrl: "/products/new",
    actionLabelKey: "help.actions.addProduct",
    steps: [
      {
        titleKey: "tour.steps.productCreate.step1Title",
        descKey: "tour.steps.productCreate.step1Desc",
      },
      {
        titleKey: "tour.steps.productCreate.step2Title",
        descKey: "tour.steps.productCreate.step2Desc",
      },
      {
        titleKey: "tour.steps.productCreate.step3Title",
        descKey: "tour.steps.productCreate.step3Desc",
      },
      {
        titleKey: "tour.steps.productCreate.step4Title",
        descKey: "tour.steps.productCreate.step4Desc",
      },
      {
        titleKey: "tour.steps.productCreate.step5Title",
        descKey: "tour.steps.productCreate.step5Desc",
      },
      {
        titleKey: "tour.steps.productCreate.step6Title",
        descKey: "tour.steps.productCreate.step6Desc",
      },
      {
        titleKey: "tour.steps.productCreate.step7Title",
        descKey: "tour.steps.productCreate.step7Desc",
      },
      {
        titleKey: "tour.steps.productCreate.step8Title",
        descKey: "tour.steps.productCreate.step8Desc",
      },
      {
        titleKey: "tour.steps.productCreate.step9Title",
        descKey: "tour.steps.productCreate.step9Desc",
      },
      {
        titleKey: "tour.steps.productCreate.step10Title",
        descKey: "tour.steps.productCreate.step10Desc",
      },
      {
        titleKey: "tour.steps.productCreate.step11Title",
        descKey: "tour.steps.productCreate.step11Desc",
        actionUrl: "/products/new",
        actionLabelKey: "help.actions.addProduct",
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
        actionUrl: "/products/new",
        actionLabelKey: "help.actions.addProduct",
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
        actionUrl: "/products",
        actionLabelKey: "help.actions.goToProducts",
      },
      {
        titleKey: "help.topics.installments.step2Title",
        descKey: "help.topics.installments.step2Desc",
        tipKey: "help.topics.installments.step2Tip",
        actionUrl: "/debts?tab=installments",
        actionLabelKey: "help.actions.goToDebts",
      },
      {
        titleKey: "help.topics.installments.step3Title",
        descKey: "help.topics.installments.step3Desc",
        tipKey: "help.topics.installments.step3Tip",
        actionUrl: "/clients?filter=debt",
        actionLabelKey: "help.actions.goToClients",
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
        actionUrl: "/finance",
        actionLabelKey: "help.actions.goToFinance",
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
  onStartTour,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTopicId?: string;
  onStartTour?: (topicId?: string) => void;
}) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selectedTopic, setSelectedTopic] = useState<HelpTopic | null>(
    helpTopics.find((t) => t.id === initialTopicId) ?? null,
  );
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepDirection, setStepDirection] = useState<"forward" | "backward">(
    "forward",
  );

  const handleSelectTopic = (topic: HelpTopic) => {
    setSelectedTopic(topic);
    setCurrentStepIndex(0);
    setStepDirection("forward");
  };

  useEffect(() => {
    if (!open) return;

    const nextTopic = helpTopics.find((topic) => topic.id === initialTopicId);
    setSelectedTopic(nextTopic ?? null);
    setCurrentStepIndex(0);
    setStepDirection("forward");
    setSearch("");
    setActiveCategory("all");
  }, [initialTopicId, open]);

  const handleNextStep = () => {
    if (!selectedTopic) return;
    if (currentStepIndex < selectedTopic.steps.length - 1) {
      setStepDirection("forward");
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setStepDirection("backward");
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleStepChange = (nextStepIndex: number) => {
    if (nextStepIndex === currentStepIndex) return;
    setStepDirection(nextStepIndex > currentStepIndex ? "forward" : "backward");
    setCurrentStepIndex(nextStepIndex);
  };

  const filteredTopics = helpTopics.filter((topic) => {
    const normalizedSearch = search.trim().toLocaleLowerCase();
    const title = t(topic.titleKey).toLowerCase();
    const summary = t(topic.summaryKey).toLowerCase();
    const matchesSearch =
      !normalizedSearch ||
      title.includes(normalizedSearch) ||
      summary.includes(normalizedSearch);
    const matchesCategory =
      activeCategory === "all" || topic.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const activeStep = selectedTopic ? selectedTopic.steps[currentStepIndex] : null;
  const SelectedTopicIcon = selectedTopic?.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100vh-1rem)] w-[94vw] max-w-4xl flex-col gap-0 overflow-hidden border-border bg-card p-0 shadow-2xl duration-200 sm:max-h-[min(90vh,52rem)] sm:max-w-4xl sm:rounded-2xl sm:duration-300">
        {/* Header */}
        <DialogHeader className="border-b bg-muted/40 px-6 py-4 shrink-0">
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
        </DialogHeader>

        {/* Main Content Area */}
        <div className="min-h-0 flex-auto overflow-x-hidden overflow-y-auto px-4 py-5 sm:p-6">
          {selectedTopic && activeStep && SelectedTopicIcon ? (
            /* Interactive Wizard View */
            <div className="mx-auto max-w-3xl space-y-5 animate-in fade-in-0 duration-300">
              {/* Back to Topics List */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedTopic(null);
                    setCurrentStepIndex(0);
                  }}
                  className="w-fit gap-2 px-2 text-xs font-bold text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="size-4" />
                  {t("help.backToList")}
                </Button>

                {onStartTour && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onOpenChange(false);
                      onStartTour(selectedTopic.id);
                    }}
                    className="w-full gap-1.5 border-sky-400/40 text-xs font-bold text-sky-600 hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-950/40 sm:w-auto"
                  >
                    <Sparkles className="size-4 text-sky-500" />
                    <span>{t("help.startGuideTour")}</span>
                  </Button>
                )}
              </div>

              {/* Selected instruction summary */}
              <div className="flex items-start gap-3 border-b pb-5 sm:gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-sky-500/12 text-sky-600 dark:bg-sky-500/18 dark:text-sky-400">
                  <SelectedTopicIcon className="size-5" />
                </span>
                <div className="min-w-0 space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                    {t("help.stepByStep")}
                  </p>
                  <h2 className="text-lg font-bold leading-tight text-foreground sm:text-xl">
                    {t(selectedTopic.titleKey)}
                  </h2>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {t(selectedTopic.summaryKey)}
                  </p>
                </div>
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
                <div
                  className="h-2.5 w-full overflow-hidden rounded-full bg-muted"
                  role="progressbar"
                  aria-label={t("help.stepByStep")}
                  aria-valuemin={1}
                  aria-valuemax={selectedTopic.steps.length}
                  aria-valuenow={currentStepIndex + 1}
                >
                  <div
                    className="h-full bg-linear-to-r from-sky-500 to-indigo-600 transition-[width] duration-700 ease-out motion-reduce:transition-none"
                    style={{
                      width: `${
                        ((currentStepIndex + 1) / selectedTopic.steps.length) * 100
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* Interactive Step Card */}
              <div
                key={`${selectedTopic.id}-${currentStepIndex}`}
                aria-live="polite"
                className={cn(
                  "space-y-5 rounded-2xl border bg-card p-4 shadow-md animate-in fade-in-0 duration-500 motion-reduce:animate-none sm:space-y-6 sm:p-6",
                  stepDirection === "forward"
                    ? "slide-in-from-right-2"
                    : "slide-in-from-left-2",
                )}
              >
                <div className="flex items-start gap-4">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white font-bold text-lg shadow-md shadow-sky-900/30">
                    {currentStepIndex + 1}
                  </span>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-foreground">
                      {stripStepNumber(t(activeStep.titleKey))}
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
                      className="w-full gap-2 border-sky-400/40 text-sky-600 hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-950/40 sm:w-auto"
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
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-t pt-4 sm:gap-4">
                <Button
                  variant="outline"
                  onClick={handlePrevStep}
                  disabled={currentStepIndex === 0}
                  className="justify-self-start gap-1.5 px-3 text-xs font-semibold"
                >
                  <ArrowLeft className="size-4" />
                  {t("help.prevStep")}
                </Button>

                <div className="flex items-center justify-center gap-0.5">
                  {selectedTopic.steps.map((_, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => handleStepChange(idx)}
                      aria-label={t("help.stepLabel", { number: idx + 1 })}
                      aria-current={idx === currentStepIndex ? "step" : undefined}
                      className="flex size-6 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
                    >
                      <span
                        className={cn(
                          "h-2 rounded-full transition-all duration-500 motion-reduce:transition-none",
                          idx === currentStepIndex
                            ? "w-6 bg-sky-600"
                            : "w-2 bg-muted hover:bg-sky-400/50",
                        )}
                      />
                    </button>
                  ))}
                </div>

                {currentStepIndex < selectedTopic.steps.length - 1 ? (
                  <Button
                    onClick={handleNextStep}
                    className="justify-self-end gap-1.5 bg-sky-600 px-3 text-xs font-bold text-white hover:bg-sky-500"
                  >
                    {t("help.nextStep")}
                    <ArrowRight className="size-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={() => onOpenChange(false)}
                    className="justify-self-end gap-1.5 bg-emerald-600 px-3 text-xs font-bold text-white hover:bg-emerald-500"
                  >
                    <Check className="size-4" />
                    {t("help.finishWizard")}
                  </Button>
                )}
              </div>
            </div>
          ) : (
            /* Topics Grid List View */
            <div className="space-y-6 animate-in fade-in-0 duration-300">
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

              {/* Interactive Screen Tour Banner */}
              {onStartTour && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-sky-500/30 bg-sky-500/10 p-4 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white shadow-md">
                      <Sparkles className="size-5" />
                    </span>
                    <div className="space-y-0.5">
                      <p className="font-bold text-foreground text-sm">{t("tour.interactiveGuide")}</p>
                      <p className="text-xs text-muted-foreground">{t("tour.bannerDesc")}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      onOpenChange(false);
                      onStartTour("quick-start");
                    }}
                    className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md shrink-0 gap-1.5 w-full sm:w-auto justify-center"
                  >
                    <Sparkles className="size-4" />
                    {t("help.startTour")}
                  </Button>
                </div>
              )}

              {/* Topics Grid */}
              {filteredTopics.length ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredTopics.map((topic) => {
                  const Icon = topic.icon;
                  return (
                    <button
                      type="button"
                      key={topic.id}
                      onClick={() => handleSelectTopic(topic)}
                      className="group flex flex-col justify-between rounded-2xl border bg-card p-5 text-left transition-all duration-300 hover:border-sky-500/50 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 motion-reduce:transition-none"
                    >
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="flex size-12 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 transition-transform duration-300 group-hover:scale-110 motion-reduce:transition-none dark:bg-sky-500/20 dark:text-sky-400">
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
                        <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none" />
                      </div>
                    </button>
                  );
                  })}
                </div>
              ) : (
                <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 px-6 text-center">
                  <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <SearchX className="size-5" />
                  </span>
                  <h3 className="mt-4 text-sm font-bold text-foreground">
                    {t("help.noResultsTitle")}
                  </h3>
                  <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                    {t("help.noResultsDescription")}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function stripStepNumber(value: string) {
  return value.replace(/^\s*\d+\.\s*/, "");
}
