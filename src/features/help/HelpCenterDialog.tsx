import { useState } from "react";
import {
  BookOpen,
  Boxes,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  FileText,
  HelpCircle,
  LucideIcon,
  Phone,
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
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { cn } from "@/shared/lib/utils";

export interface HelpTopic {
  id: string;
  category: "getting-started" | "imei" | "installments" | "finance" | "users";
  icon: LucideIcon;
  titleKey: string;
  summaryKey: string;
  actionUrl?: string;
  actionLabelKey?: string;
  steps: {
    titleKey: string;
    descKey: string;
  }[];
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
      },
      {
        titleKey: "help.topics.quickStart.step2Title",
        descKey: "help.topics.quickStart.step2Desc",
      },
      {
        titleKey: "help.topics.quickStart.step3Title",
        descKey: "help.topics.quickStart.step3Desc",
      },
      {
        titleKey: "help.topics.quickStart.step4Title",
        descKey: "help.topics.quickStart.step4Desc",
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
      },
      {
        titleKey: "help.topics.imei.step2Title",
        descKey: "help.topics.imei.step2Desc",
      },
      {
        titleKey: "help.topics.imei.step3Title",
        descKey: "help.topics.imei.step3Desc",
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
      },
      {
        titleKey: "help.topics.installments.step2Title",
        descKey: "help.topics.installments.step2Desc",
      },
      {
        titleKey: "help.topics.installments.step3Title",
        descKey: "help.topics.installments.step3Desc",
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
      },
      {
        titleKey: "help.topics.finance.step2Title",
        descKey: "help.topics.finance.step2Desc",
      },
      {
        titleKey: "help.topics.finance.step3Title",
        descKey: "help.topics.finance.step3Desc",
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
      },
      {
        titleKey: "help.topics.users.step2Title",
        descKey: "help.topics.users.step2Desc",
      },
      {
        titleKey: "help.topics.users.step3Title",
        descKey: "help.topics.users.step3Desc",
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-hidden p-0 sm:rounded-2xl">
        <DialogHeader className="border-b bg-muted/30 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-sky-500/15 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400">
                <HelpCircle className="size-5" />
              </span>
              <div>
                <DialogTitle className="text-xl font-bold tracking-tight">
                  {t("help.title")}
                </DialogTitle>
                <p className="text-xs text-muted-foreground">
                  {t("help.subtitle")}
                </p>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-5">
          {selectedTopic ? (
            <div className="space-y-5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedTopic(null)}
                className="gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
                {t("help.backToList")}
              </Button>

              <div className="rounded-xl border bg-card p-5 shadow-xs space-y-4">
                <div className="flex items-start gap-4">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400">
                    <selectedTopic.icon className="size-6" />
                  </span>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-foreground">
                      {t(selectedTopic.titleKey)}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {t(selectedTopic.summaryKey)}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {t("help.stepByStep")}
                  </h4>
                  <div className="space-y-3">
                    {selectedTopic.steps.map((step, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 rounded-lg border bg-muted/20 p-3.5"
                      >
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-sky-600 text-xs font-bold text-white">
                          {idx + 1}
                        </span>
                        <div className="space-y-1">
                          <h5 className="text-sm font-semibold text-foreground">
                            {t(step.titleKey)}
                          </h5>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {t(step.descKey)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedTopic.actionUrl && (
                  <div className="pt-3 border-t">
                    <Button asChild className="w-full sm:w-auto bg-sky-600 hover:bg-sky-500 text-white">
                      <NavLink
                        to={selectedTopic.actionUrl}
                        onClick={() => onOpenChange(false)}
                      >
                        {t(selectedTopic.actionLabelKey ?? "common.open")}
                        <ChevronRight className="size-4 ml-1" />
                      </NavLink>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("help.searchPlaceholder")}
                  className="pl-9"
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

              <ScrollArea className="max-h-[380px] pr-2">
                <div className="grid gap-3 sm:grid-cols-2">
                  {filteredTopics.map((topic) => {
                    const Icon = topic.icon;
                    return (
                      <div
                        key={topic.id}
                        onClick={() => setSelectedTopic(topic)}
                        className="group flex flex-col justify-between rounded-xl border bg-card p-4 transition-all hover:border-sky-500/40 hover:shadow-md cursor-pointer"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="flex size-10 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400 group-hover:scale-105 transition-transform">
                              <Icon className="size-5" />
                            </span>
                            <ChevronRight className="size-4 text-muted-foreground group-hover:text-sky-500 group-hover:translate-x-0.5 transition-all" />
                          </div>
                          <div>
                            <h3 className="font-bold text-foreground text-sm group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                              {t(topic.titleKey)}
                            </h3>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                              {t(topic.summaryKey)}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 pt-2 border-t text-[11px] font-semibold text-sky-600 dark:text-sky-400 flex items-center gap-1">
                          <span>{t("help.readGuide")}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
