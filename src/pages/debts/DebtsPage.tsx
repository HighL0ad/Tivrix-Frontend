import { Copy, ChevronDown, CalendarDays, AlertCircle, CalendarClock, HandCoins, TrendingUp, UsersRound, WalletCards, Landmark, ShoppingCart, Banknote, Eye } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { parseAsStringLiteral, useQueryStates } from "nuqs";
import { NavLink } from "react-router";
import { type ReactNode, useState } from "react";

import { useCurrentUser } from "@/entities/auth/api/use-current-user";
import {
  type DebtWallet,
  type RepaymentOperationType,
  type Payable,
  useDebts,
} from "@/entities/debts/api/use-debts";
import { useFinance } from "@/entities/finance/api/use-finance";
import type { Wallet } from "@/entities/finance/api/use-finance";
import { useDashboard } from "@/entities/dashboard/api/use-dashboard";
import { Money } from "@/shared/ui/money-display";
import { MetricCard } from "@/shared/ui/metric-card";
import { MoneyFlowDialog } from "@/features/debts/MoneyFlowDialog";
import { PayableDialog } from "@/features/debts/PayableDialog";
import { RepayDialog } from "@/features/debts/RepayDialog";
import { money, relativeDate, shortDate } from "@/shared/lib/format";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { EmptyState } from "@/shared/ui/empty-state";
import { PageHeader } from "@/shared/ui/page-header";
import { PageError, PageLoading } from "@/shared/ui/page-state";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/ui/tooltip";
import { cn } from "@/shared/lib/utils";
import { Skeleton } from "@/shared/ui/skeleton";

const debtsActionValues = ["lend", "borrow"] as const;
const debtsTabValues = ["debts", "installments"] as const;

export function DebtsPage() {
  const { t, i18n } = useTranslation();
  const [{ action, tab }, setDebtsParams] = useQueryStates({
    action: parseAsStringLiteral(debtsActionValues),
    tab: parseAsStringLiteral(debtsTabValues).withDefault("debts"),
  });
  const currentUserQuery = useCurrentUser();
  const isCreditEnabled = currentUserQuery.data?.credit_system_enabled ?? true;
  const activeTab = tab === "installments" && !isCreditEnabled ? "debts" : tab;

  const debtsQuery = useDebts();
  const financeQuery = useFinance({ page: 1 });
  const dashboardQuery = useDashboard();

  if (debtsQuery.isLoading) {
    return <PageLoading />;
  }

  if (!debtsQuery.data) {
    return <PageError />;
  }

  const data = debtsQuery.data;
  const debtSections = [
    {
      key: "we_owe" as const,
      title: t("debts.weOwe"),
      wallets: data.we_owe,
      operationType: "pay_supplier" as const,
    },
    {
      key: "shops" as const,
      title: t("debts.shopsOweUs"),
      wallets: data.shops_owe_us,
      operationType: "receive_partner" as const,
    },
    {
      key: "clients" as const,
      title: t("debts.clientsOweUs"),
      wallets: data.clients_owe_us,
      operationType: "receive_client" as const,
    },
  ];
  const hasAnyDebts =
    data.we_owe.length ||
    data.shops_owe_us.length ||
    data.clients_owe_us.length ||
    data.unpaid_payables.length;

  const fData = financeQuery.data;
  const maxMonthlyForecast = fData
    ? Math.max(...fData.attention.monthly_forecast.map((item) => Number(item.amount)), 1)
    : 1;
  const installmentsReturnTo = "/debts?tab=installments";

  return (
    <section className="space-y-5">
      <PageHeader
        title={t("app.nav.debts")}
        description={t("debts.description")}
        actions={
          activeTab === "debts" ? (
            <>
              <MoneyFlowDialog
                title={t("debts.lend")}
                trigger={t("debts.lendToClientPartner")}
                sourceWallets={data.my_wallets}
                targetWallets={data.lend_counterparties}
                mode="lend"
                open={action === "lend"}
                onOpenChange={(open) => setDebtsParams({ action: open ? "lend" : null })}
              />
              <MoneyFlowDialog
                title={t("debts.borrow")}
                trigger={t("debts.borrow")}
                sourceWallets={data.all_partners}
                targetWallets={data.my_wallets}
                mode="borrow"
                open={action === "borrow"}
                onOpenChange={(open) => setDebtsParams({ action: open ? "borrow" : null })}
              />
            </>
          ) : null
        }
      />

      <Tabs
        value={activeTab}
        onValueChange={(value) =>
          setDebtsParams({ tab: value as "debts" | "installments" })
        }
      >
        <TabsList>
          <TabsTrigger value="debts">{t("finance.overview")}</TabsTrigger>
          {isCreditEnabled && (
            <TabsTrigger value="installments">{t("dashboard.creditSystem")}</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="debts" className="mt-4 space-y-5">
          {!hasAnyDebts ? (
            <EmptyState
              title={t("debts.emptyTitle")}
              description={t("debts.emptyDescription")}
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  <MoneyFlowDialog
                    title={t("debts.lend")}
                    trigger={t("debts.lendToClientPartner")}
                    sourceWallets={data.my_wallets}
                    targetWallets={data.lend_counterparties}
                    mode="lend"
                    open={action === "lend"}
                    onOpenChange={(open) => setDebtsParams({ action: open ? "lend" : null })}
                  />
                  <MoneyFlowDialog
                    title={t("debts.borrow")}
                    trigger={t("debts.borrow")}
                    sourceWallets={data.all_partners}
                    targetWallets={data.my_wallets}
                    mode="borrow"
                    open={action === "borrow"}
                    onOpenChange={(open) => setDebtsParams({ action: open ? "borrow" : null })}
                  />
                </div>
              }
            />
          ) : null}

          {hasAnyDebts ? (
            <>
              <div className="grid gap-4 lg:grid-cols-3">
                {debtSections.map((section) => (
                  <DebtGroupBlock
                    key={section.key}
                    title={section.title}
                    wallets={section.wallets}
                    myWallets={data.my_wallets}
                    debtCreatedAt={data.debt_created_at}
                    operationType={section.operationType}
                    tone={
                      section.key === "shops"
                        ? "blue"
                        : section.operationType === "pay_supplier"
                          ? "bad"
                          : "good"
                    }
                  />
                ))}
              </div>
              <PayablesBlock payables={data.unpaid_payables} myWallets={data.my_wallets} />
            </>
          ) : null}
        </TabsContent>

        <TabsContent value="installments" className="mt-4 space-y-6">
          {(financeQuery.isPending && !financeQuery.data) || (dashboardQuery.isPending && !dashboardQuery.data) ? (
            <InstallmentsSkeleton />
          ) : !fData || !dashboardQuery.data ? (
            <div className="flex min-h-64 items-center justify-center rounded-lg border border-dashed text-sm text-rose-600">
              {t("finance.permissionRestricted")}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Раздел 1: Баланс кредитной системы с иерархией KPI */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <Landmark className="size-3.5 text-sky-600" />
                  {t("dashboard.creditSystem")}
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
                  {/* Основная касса — Тёмная и увеличенная */}
                  <div className="sm:col-span-2 rounded-lg border border-slate-950 bg-slate-900 text-white p-5 shadow-sm flex flex-col justify-between min-h-[116px]">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          {t("dashboard.mainCash")}
                        </div>
                        <div className="mt-1.5 text-3xl font-black tracking-tight text-white font-sans">
                          <Money value={dashboardQuery.data.main_cash_balance ?? dashboardQuery.data.total_money} />
                        </div>
                      </div>
                      <span className="flex size-9 items-center justify-center rounded-full bg-white/10 text-white">
                        <Banknote className="size-4.5" />
                      </span>
                    </div>
                    <div className="mt-2 text-[10px] text-slate-400 font-medium">
                      {t("dashboard.mainCashHint")}
                    </div>
                  </div>

                  {/* Вторичные KPI */}
                  <MetricCard
                    title={t("dashboard.creditCash")}
                    value={<Money value={dashboardQuery.data.credit_cash_balance ?? 0} />}
                    hint={t("dashboard.creditCashHint")}
                    tone="good"
                    icon={<HandCoins className="size-4" />}
                  />
                  <MetricCard
                    title={t("dashboard.internalDebt")}
                    value={<Money value={dashboardQuery.data.internal_credit_debt ?? 0} />}
                    hint={t("dashboard.internalDebtHint")}
                    tone="warning"
                    icon={<Landmark className="size-4" />}
                  />
                  <MetricCard
                    title={t("dashboard.netCreditProfit")}
                    value={<Money value={dashboardQuery.data.net_credit_profit ?? 0} />}
                    hint={t("dashboard.netCreditProfitHint")}
                    tone="violet"
                    icon={<TrendingUp className="size-4" />}
                  />
                  <MetricCard
                    title={t("dashboard.activeCreditsTotal")}
                    value={<Money value={dashboardQuery.data.active_credits_total ?? 0} />}
                    hint={t("dashboard.activeCreditsTotalHint")}
                    tone="info"
                    icon={<ShoppingCart className="size-4" />}
                  />
                </div>
              </div>

              {/* Раздел 2: Сборы и операционные показатели (Цвет как язык) */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <Eye className="size-3.5 text-indigo-600" />
                  {t("finance.attentionTitle")}
                </div>
                
                <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
                  {/* Левая часть: 5 цветных операционных карточек */}
                  <div className="grid gap-3 sm:grid-cols-2 md:col-span-2 xl:col-span-3">
                    <AttentionMetric
                      title={t("finance.dueToday")}
                      value={money(fData.attention.installment_due_today_amount)}
                      hint={t("finance.paymentsCount", {
                        count: String(fData.attention.installment_due_today_count),
                      })}
                      icon={<CalendarClock className="size-5" />}
                      className="border-sky-200 bg-sky-100/70 text-sky-950"
                    />
                    <AttentionMetric
                      title={t("finance.overdueInstallments")}
                      value={money(fData.attention.installment_overdue_amount)}
                      hint={t("finance.paymentsCount", {
                        count: String(fData.attention.installment_overdue_count),
                      })}
                      icon={<AlertCircle className="size-5" />}
                      className="border-rose-200 bg-rose-100 text-rose-950 font-extrabold"
                    />
                    <AttentionMetric
                      title={t("finance.next7dReceipts")}
                      value={money(fData.attention.installment_next_7d_amount)}
                      hint={t("finance.paymentsCount", {
                        count: String(fData.attention.installment_next_7d_count),
                      })}
                      icon={<TrendingUp className="size-5" />}
                      className="border-emerald-200 bg-emerald-100/70 text-emerald-950"
                    />
                    <AttentionMetric
                      title={t("finance.next30dReceipts")}
                      value={money(fData.attention.installment_next_30d_amount)}
                      hint={t("finance.paymentsCount", {
                        count: String(fData.attention.installment_next_30d_count),
                      })}
                      icon={<WalletCards className="size-5" />}
                      className="border-violet-200 bg-violet-100/70 text-violet-950"
                    />
                    <AttentionMetric
                      title={t("finance.shopOverdue")}
                      value={money(fData.attention.shop_overdue_amount)}
                      hint={t("finance.dealsCount", {
                        count: String(fData.attention.shop_overdue_count),
                      })}
                      icon={<HandCoins className="size-5" />}
                      className="border-amber-200 bg-amber-100/70 text-amber-950"
                    />
                  </div>

                  {/* Правая часть: Выделенный счётчик активных клиентов */}
                  <div className="rounded-lg border border-border bg-linear-to-b from-card to-muted/45 backdrop-blur-xs p-5 flex flex-col justify-between shadow-xs min-h-[180px]">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        {t("finance.activeInstallmentClients")}
                      </div>
                      <div className="mt-1 text-[11px] font-semibold text-muted-foreground leading-tight">
                        {t("finance.clientsWithActiveInstallments")}
                      </div>
                    </div>
                    <div className="mt-4 flex items-baseline gap-1.5 md:gap-2">
                      <span className="text-4xl md:text-6xl font-black tracking-tight text-foreground font-sans leading-none">
                        {fData.attention.active_installment_clients_count}
                      </span>
                      <span className="text-xs md:text-sm font-bold text-muted-foreground lowercase">{t("app.nav.clients")}</span>
                    </div>
                    <div className="mt-4 border-t border-border pt-3 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <UsersRound className="size-3.5 text-muted-foreground" />
                        <span>{t("finance.crmSync")}</span>
                      </div>
                      <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-full border border-emerald-100/85 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                        <span className="relative flex size-1.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full size-1.5 bg-emerald-500"></span>
                        </span>
                        <span className="text-[9px] font-extrabold tracking-normal">
                          {t("common.active").toLocaleLowerCase(i18n.resolvedLanguage)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Раздел 3: Таблицы и графики (Полировка списков) */}
              <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
                {/* Список предстоящих платежей с цветными аватарами и пилюльками */}
                <Card className="py-0 gap-0 overflow-hidden bg-card border-border">
                  <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-border px-4 py-3 bg-muted/35">
                    <CardTitle className="text-sm font-bold text-card-foreground">{t("finance.upcomingPayments")}</CardTitle>
                    <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-xs font-bold text-sky-600 hover:text-sky-700">
                      <NavLink to="/clients">{t("app.nav.clients")}</NavLink>
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    {fData.attention.upcoming_installments.length ? (
                      <ScrollArea className="h-[27rem] min-h-[12rem]">
                        <div className="divide-y divide-border">
                          {fData.attention.upcoming_installments.map((item) => (
                            <div
                              key={item.id}
                              className="px-4 py-3 text-sm transition-colors hover:bg-muted/50"
                            >
                              <div className="grid grid-cols-[2rem_minmax(0,1fr)_auto] gap-x-3 gap-y-1.5 sm:hidden">
                                <div
                                  className="row-span-2 flex size-8 shrink-0 items-center justify-center self-center rounded-full border text-xs font-black uppercase shadow-sm ring-1 ring-white/8 select-none"
                                  style={getAvatarColorStyle(item.client_id)}
                                >
                                  {getInitials(item.client_name)}
                                </div>
                                <div className="min-w-0">
                                  <NavLink
                                    to={`/clients/${item.client_id}`}
                                    state={{ from: installmentsReturnTo }}
                                    className="block truncate font-bold leading-5 text-foreground transition-all duration-200 hover:text-primary"
                                  >
                                    {item.client_name}
                                  </NavLink>
                                  {item.product_name ? (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="block truncate text-[11px] font-medium leading-4 text-muted-foreground">
                                          {item.product_name}
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-80 whitespace-normal break-words">
                                        {item.product_name}
                                      </TooltipContent>
                                    </Tooltip>
                                  ) : null}
                                </div>
                                <div className="shrink-0 self-start text-right font-sans text-sm font-black leading-5 text-foreground">
                                  {money(item.remaining_amount)}
                                </div>
                                <div className="col-span-2 col-start-2 flex min-w-0 items-center justify-between gap-2">
                                  {renderDuePill(item.days_until_due, t)}
                                  <span className="shrink-0 font-mono text-[10px] font-bold text-muted-foreground">
                                    {formatInstallmentDueDate(item.due_date)}
                                  </span>
                                </div>
                              </div>

                              <div className="hidden items-center justify-between gap-3 sm:flex">
                                <div className="flex min-w-0 flex-1 items-center">
                                  {/* Цветные аватары с инициалами */}
                                  <div
                                    className="mr-3 flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-black uppercase shadow-sm ring-1 ring-white/8 select-none"
                                    style={getAvatarColorStyle(item.client_id)}
                                  >
                                    {getInitials(item.client_name)}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <NavLink
                                      to={`/clients/${item.client_id}`}
                                      state={{ from: installmentsReturnTo }}
                                      className="inline-block max-w-full truncate font-bold text-foreground transition-all duration-200 hover:translate-x-0.5 hover:text-primary"
                                    >
                                      {item.client_name}
                                    </NavLink>
                                    {item.product_name ? (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span className="block max-w-full truncate text-[11px] font-medium text-muted-foreground">
                                            {item.product_name}
                                          </span>
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-80 whitespace-normal break-words">
                                          {item.product_name}
                                        </TooltipContent>
                                      </Tooltip>
                                    ) : null}
                                  </div>
                                </div>

                                {/* Быстро читаемые даты и пилюльки */}
                                <div className="flex shrink-0 items-center gap-4">
                                  <div className="flex flex-col items-end gap-0.5">
                                    {renderDuePill(item.days_until_due, t)}
                                    <span className="font-mono text-[10px] font-bold text-muted-foreground">
                                      {formatInstallmentDueDate(item.due_date)}
                                    </span>
                                  </div>
                                  <div className="min-w-[76px] text-right font-sans text-sm font-black text-foreground">
                                    {money(item.remaining_amount)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    ) : (
                      <div className="rounded-lg border border-dashed m-4 p-6 text-center text-sm text-muted-foreground">
                        {t("finance.noUpcomingPayments")}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Прогноз сборов с тонкими барами */}
                <Card className="py-0 gap-0 bg-card border-border">
                  <CardHeader className="border-b border-border px-4 py-3 bg-muted/35">
                    <CardTitle className="text-sm font-bold text-card-foreground">{t("finance.monthlyForecast")}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-1">
                    {fData.attention.monthly_forecast.length ? (
                      <div className="divide-y divide-border">
                        {fData.attention.monthly_forecast.map((item) => {
                          const amount = Number(item.amount);
                          const width = `${Math.max((amount / maxMonthlyForecast) * 100, amount > 0 ? 8 : 0)}%`;

                          return (
                            <div key={item.month} className="flex flex-col gap-1.5 py-3 first:pt-0 last:pb-0">
                              <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
                                <span className="uppercase tracking-wider">
                                  {formatForecastMonth(item.month, t)}
                                </span>
                                <span className="font-mono text-muted-foreground text-[11px]">
                                  {t("finance.paymentsCount", { count: String(item.count) })}
                                </span>
                              </div>
                              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                                <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width }} />
                              </div>
                              <div className="flex items-center justify-between mt-0.5">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                  {t("finance.collectionPlan")}
                                </span>
                                <span className="text-sm font-black text-foreground font-sans">{money(item.amount)}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                        {t("finance.noForecast")}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </section>
  );
}

function PayablesBlock({
  payables,
  myWallets,
}: {
  payables: Payable[];
  myWallets: Wallet[];
}) {
  const { t } = useTranslation();
  const total = sumPayables(payables);

  return (
    <Card className="gap-0 py-0 card-accent-amber">
      <CardHeader className="flex flex-row items-center justify-between gap-3 border-b px-4 py-3">
        <CardTitle className="min-w-0 text-sm">{t("debts.unpaidPayables")}</CardTitle>
        <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/35 dark:bg-amber-500/10 dark:text-amber-300">
          {money(total)}
        </Badge>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[min(27rem,calc(100vh-18rem))] min-h-[12rem]">
          <PayableRows payables={payables} myWallets={myWallets} />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function PayableRows({
  payables: initialPayables,
  myWallets,
}: {
  payables: Payable[];
  myWallets: Wallet[];
}) {
  const { t } = useTranslation();
  if (!initialPayables.length) {
    return (
      <div className="px-4 py-8 text-center text-sm text-muted-foreground">
        {t("debts.noUnpaidPayables")}
      </div>
    );
  }

  // Sort payables: overdue first, then soon, then later, nulls last
  const payables = [...initialPayables].sort((a, b) => {
    if (!a.due_at && !b.due_at) return 0;
    if (!a.due_at) return 1;
    if (!b.due_at) return -1;
    return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
  });

  return (
    <div className="divide-y">
      {payables.map((payable) => {
        const payableCategory = formatPayableCategory(payable.category, t);
        const imeis = [payable.product_imei, payable.product_imei2].filter(
          (imei): imei is string => Boolean(imei),
        );
        const dueTime = payable.due_at ? new Date(payable.due_at).getTime() : 0;
        const isOverdue = dueTime && dueTime < Date.now();
        const isDueSoon =
          dueTime && !isOverdue && dueTime < Date.now() + 3 * 24 * 60 * 60 * 1000;

        return (
          <div
            key={payable.id}
            className="flex flex-col gap-3 px-4 py-3 text-sm transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 items-start gap-3">
              <div
                className={`mt-1.5 size-2.5 shrink-0 rounded-full animate-pulse ${
                  isOverdue ? "bg-rose-500" : "bg-amber-500"
                }`}
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-semibold">{payableCategory}</span>
                  <span className="text-xs text-muted-foreground">
                    {payable.product_name ?? t("products.noProduct")}
                  </span>
                </div>

                {payable.due_at ? (
                  <div
                    className={`mt-1 flex items-center gap-1.5 whitespace-nowrap text-xs font-medium ${
                      isOverdue
                        ? "text-rose-600"
                        : isDueSoon
                          ? "text-amber-600"
                          : "text-muted-foreground"
                    }`}
                  >
                    <CalendarDays className="size-3.5 shrink-0" />
                    <span>
                      {isOverdue ? t("debts.overdue") : t("debts.dueDate")}:{" "}
                      {relativeDate(payable.due_at, t)}
                    </span>
                  </div>
                ) : null}

                {imeis.length ? (
                  <>
                    <div className="mt-2 hidden min-w-0 flex-row flex-wrap items-center gap-1.5 text-xs text-muted-foreground sm:flex">
                      {imeis.map((imei, index) => (
                        <div
                          key={`${payable.id}-${imei}`}
                          className="flex max-w-full min-w-0 items-center justify-between gap-1 rounded-md bg-muted px-1.5 py-1"
                        >
                          <span className="min-w-0 break-all font-mono">
                            IMEI {index + 1}: {imei}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-6 shrink-0"
                            aria-label={t("products.copyImei")}
                            onClick={() => copyImei(imei, t)}
                          >
                            <Copy className="size-3" aria-hidden="true" />
                          </Button>
                        </div>
                      ))}
                      {imeis.length > 1 ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 shrink-0 gap-1 px-2 text-xs"
                          aria-label={t("debts.copyAllImeis")}
                          onClick={() => copyImei(imeis.join("\n"), t)}
                        >
                          <Copy className="size-3" aria-hidden="true" />
                          {t("debts.copyAllImeis")}
                        </Button>
                      ) : null}
                    </div>

                    <div className="mt-2 flex sm:hidden">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1 bg-muted/50 px-2 text-xs hover:bg-muted"
                          >
                            <span className="font-mono text-muted-foreground">
                              IMEI{imeis.length > 1 ? ` (${imeis.length})` : ""}
                            </span>
                            <ChevronDown className="size-3 text-muted-foreground/70" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          {imeis.map((imei, index) => (
                            <DropdownMenuItem
                              key={`${payable.id}-dropdown-${imei}`}
                              onSelect={() => copyImei(imei, t)}
                            >
                              <Copy className="mr-2 size-3" />
                              <span className="font-mono">
                                IMEI {index + 1}: {imei}
                              </span>
                            </DropdownMenuItem>
                          ))}
                          {imeis.length > 1 ? (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onSelect={() => copyImei(imeis.join("\n"), t)}
                              >
                                <Copy className="mr-2 size-3" />
                                {t("debts.copyAllImeis")}
                              </DropdownMenuItem>
                            </>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </>
                ) : null}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t pt-2 sm:border-0 sm:pt-0">
              <span className="whitespace-nowrap font-bold text-amber-700 sm:text-base">
                {money(payable.amount)}
              </span>
              <PayableDialog
                payable={payable}
                wallets={myWallets}
                title={payableCategory}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DebtGroupBlock({
  title,
  wallets,
  myWallets,
  debtCreatedAt,
  operationType,
  tone,
}: {
  title: string;
  wallets: DebtWallet[];
  myWallets: Wallet[];
  debtCreatedAt: Record<string, string>;
  operationType: RepaymentOperationType;
  tone: DebtTone;
}) {
  const total = sumWallets(wallets);
  const totalClass = {
    bad: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/35 dark:bg-rose-500/10 dark:text-rose-300",
    blue: "border-blue-200 bg-blue-50 text-blue-700 dark:border-sky-500/35 dark:bg-sky-500/10 dark:text-sky-300",
    good: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/35 dark:bg-emerald-500/10 dark:text-emerald-300",
  }[tone];
  const cardClass = {
    bad: "gap-0 py-0 card-accent-rose",
    blue: "gap-0 border-blue-200 py-0 card-accent-violet",
    good: "gap-0 py-0 card-accent-emerald",
  }[tone];
  const headerClass = tone === "blue"
    ? "flex flex-row items-center justify-between gap-3 border-b border-blue-200 bg-blue-50/50 px-4 py-3 dark:border-sky-500/25 dark:bg-sky-500/10"
    : "flex flex-row items-center justify-between gap-3 border-b px-4 py-3";

  return (
    <Card className={cardClass}>
      <CardHeader className={headerClass}>
        <CardTitle className="min-w-0 text-sm">
          {title}
        </CardTitle>
        <Badge variant="outline" className={totalClass}>
          {money(total)}
        </Badge>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[min(27rem,calc(100vh-18rem))] min-h-[12rem]">
          <WalletRows
            wallets={wallets}
            myWallets={myWallets}
            debtCreatedAt={debtCreatedAt}
            operationType={operationType}
            tone={tone}
          />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function WalletRow({
  wallet,
  myWallets,
  debtCreatedAt,
  operationType,
  tone,
  dotClass,
  amountClass,
}: {
  wallet: DebtWallet;
  myWallets: Wallet[];
  debtCreatedAt: Record<string, string>;
  operationType: RepaymentOperationType;
  tone: DebtTone;
  dotClass: string;
  amountClass: string;
}) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const entries = wallet.debt_entries ?? [];
  const canOpenClient = operationType === "receive_client" && wallet.client_id;

  return (
    <div className="border-b px-4 py-3 text-sm transition-colors last:border-b-0 hover:bg-muted/50">
      <div
        className={cn(
          "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3",
          entries.length > 0 && "cursor-pointer select-none"
        )}
        onClick={entries.length > 0 ? () => setIsExpanded(!isExpanded) : undefined}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`size-2.5 shrink-0 rounded-full animate-pulse ${dotClass}`}
            aria-hidden="true"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              {canOpenClient ? (
                <NavLink
                  to={`/clients/${wallet.client_id}`}
                  state={{ from: "/debts" }}
                  className="break-words font-semibold text-foreground transition-all duration-200 hover:text-primary hover:translate-x-0.5"
                  onClick={(event) => event.stopPropagation()}
                >
                  {wallet.name}
                </NavLink>
              ) : (
                <div className="break-words font-semibold">{wallet.name}</div>
              )}
              {entries.length > 0 && (
                <ChevronDown
                  className={cn(
                    "size-4 shrink-0 text-muted-foreground/70 transition-transform duration-200",
                    isExpanded && "rotate-180"
                  )}
                />
              )}
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {shortDate(debtCreatedAt[String(wallet.id)])}
            </div>
            {wallet.due_date && entries.length === 0 && (
              <DebtDueDateLine dueDate={wallet.due_date} />
            )}
          </div>
        </div>
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <span className={`whitespace-nowrap font-bold ${amountClass}`}>
            {money(wallet.balance)}
          </span>
          <RepayDialog
            wallet={wallet}
            myWallets={myWallets}
            operationType={operationType}
            tone={tone}
          />
        </div>
      </div>
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-in-out",
          isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          {entries.length > 0 && (
            <div className="pt-3 space-y-2 pl-5 pb-0.5">
              {entries.map((entry) => {
                const parsed = parseDebtEntryDescription(entry.description, t);
                return (
                  <div
                    key={entry.id}
                    className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 rounded-md border bg-background px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="break-words text-xs font-semibold">
                        {parsed.title}
                      </div>
                      {parsed.comment && (
                        <div className="mt-0.5 break-words text-[11px] font-medium text-muted-foreground">
                          {parsed.comment}
                        </div>
                      )}
                      <div className="mt-0.5 text-[11px] text-muted-foreground">
                        {shortDate(entry.created_at)}
                      </div>
                      {entry.due_date && <DebtDueDateLine dueDate={entry.due_date} compact />}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`whitespace-nowrap text-xs font-bold ${amountClass}`}>
                        {money(entry.remaining_amount)}
                      </span>
                      {entry.id > 0 && (
                        <RepayDialog
                          wallet={wallet}
                          myWallets={myWallets}
                          operationType={operationType}
                          tone={tone}
                          debtEntry={entry}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function WalletRows({
  wallets,
  myWallets,
  debtCreatedAt,
  operationType,
  tone,
}: {
  wallets: DebtWallet[];
  myWallets: Wallet[];
  debtCreatedAt: Record<string, string>;
  operationType: RepaymentOperationType;
  tone: DebtTone;
}) {
  const { t } = useTranslation();
  const dotClass = {
    bad: "bg-rose-500",
    blue: "bg-blue-500",
    good: "bg-emerald-500",
  }[tone];
  const amountClass = {
    bad: "text-rose-700",
    blue: "text-blue-700",
    good: "text-emerald-700",
  }[tone];

  return (
    <div>
      {wallets.length ? (
        wallets.map((wallet) => (
          <WalletRow
            key={wallet.id}
            wallet={wallet}
            myWallets={myWallets}
            debtCreatedAt={debtCreatedAt}
            operationType={operationType}
            tone={tone}
            dotClass={dotClass}
            amountClass={amountClass}
          />
        ))
      ) : (
        <div className="px-4 py-8 text-center text-sm text-muted-foreground">
          {operationType === "pay_supplier"
            ? t("catalogs.suppliersEmptyTitle")
            : operationType === "receive_partner"
              ? t("catalogs.shopsEmptyTitle")
              : t("catalogs.clientsEmptyTitle")}
        </div>
      )}
    </div>
  );
}

function DebtDueDateLine({ dueDate, compact = false }: { dueDate: string; compact?: boolean }) {
  const { t } = useTranslation();
  return (
    <div
      className={cn(
        "mt-1 flex min-w-0 items-center gap-1 whitespace-nowrap font-medium",
        compact ? "text-[11px]" : "text-xs",
        new Date(dueDate).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0)
          ? "text-rose-600 font-semibold animate-pulse"
          : "text-amber-600"
      )}
    >
      <CalendarDays className="size-3.5 shrink-0" />
      <span className="min-w-0 truncate">
        {t("debts.dueDate")}: {relativeDate(dueDate, t)}
      </span>
    </div>
  );
}

function sumWallets(wallets: Wallet[]) {
  return wallets.reduce((total, wallet) => total + Number(wallet.balance), 0);
}

function sumPayables(payables: Payable[]) {
  return payables.reduce((total, payable) => total + Number(payable.amount), 0);
}

type DebtTone = "good" | "bad" | "blue";

async function copyImei(value: string, t: (key: string) => string) {
  await navigator.clipboard.writeText(value);
  toast.info(t("products.imeiCopied"));
}

function AttentionMetric({
  title,
  value,
  hint,
  icon,
  className,
}: {
  title: string;
  value: string;
  hint: string;
  icon: ReactNode;
  className: string;
}) {
  return (
    <div className={cn("flex items-center gap-3 rounded-lg border p-4 text-sm", className)}>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/40 dark:bg-white/10">
        {icon}
      </span>
      <div className="min-w-0">
        <div className="truncate font-semibold uppercase tracking-wide text-[10px] opacity-80">
          {title}
        </div>
        <div className="mt-0.5 text-lg font-black tracking-tight">{value}</div>
        <div className="mt-0.5 truncate text-[11px] font-medium opacity-80">{hint}</div>
      </div>
    </div>
  );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function getAvatarColorStyle(id: number) {
  const hues = [200, 260, 320, 45, 140, 15, 80, 290];
  const hue = hues[id % hues.length];
  return {
    backgroundColor: `light-dark(hsl(${hue}, 78%, 90%), color-mix(in srgb, hsl(${hue}, 72%, 46%) 52%, #0f172a))`,
    borderColor: `light-dark(hsl(${hue}, 62%, 78%), color-mix(in srgb, hsl(${hue}, 80%, 72%) 56%, transparent))`,
    color: `light-dark(hsl(${hue}, 72%, 28%), hsl(${hue}, 92%, 90%))`,
  };
}

function renderDuePill(daysUntilDue: number, t: any) {
  if (daysUntilDue < 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-800 border border-rose-200">
        {t("finance.daysOverdue", { count: Math.abs(daysUntilDue) })}
      </span>
    );
  }
  if (daysUntilDue === 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-800 border border-sky-200 animate-pulse">
        {t("finance.dueToday")}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
      {t("common.inNDays", { n: daysUntilDue })}
    </span>
  );
}

function formatInstallmentDueDate(value: string | null | undefined) {
  if (!value) return "—";
  const [datePart] = value.split("T");
  const [year, month, day] = datePart.split("-");
  if (year && month && day) {
    return `${day}.${month}.${year.slice(-2)}`;
  }
  return shortDate(value).split(",")[0] ?? value;
}

function formatPayableCategory(category: string, t: (key: string) => string) {
  if (category.trim().toLowerCase() === "регистрация imei") {
    return t("debts.payableCategory.registrationImei");
  }
  return category;
}

function formatForecastMonth(value: string, t: (key: string) => string) {
  const [year, month] = value.split("-");
  if (!year || !month) return value;
  const monthNumber = Number(month);
  if (!Number.isInteger(monthNumber) || monthNumber < 1 || monthNumber > 12) {
    return value;
  }
  return `${t(`finance.month.${monthNumber}`)} ${year}`;
}

function InstallmentsSkeleton() {
  return (
    <div className="space-y-6">
      {/* KPI Cards Skeleton */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          <Skeleton className="sm:col-span-2 h-[116px] w-full" />
          <Skeleton className="h-[116px] w-full" />
          <Skeleton className="h-[116px] w-full" />
          <Skeleton className="h-[116px] w-full" />
          <Skeleton className="h-[116px] w-full" />
        </div>
      </div>

      {/* Attention Cards Skeleton */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
          <div className="grid gap-3 sm:grid-cols-2 md:col-span-2 xl:col-span-3">
            <Skeleton className="h-[96px] w-full" />
            <Skeleton className="h-[96px] w-full" />
            <Skeleton className="h-[96px] w-full" />
            <Skeleton className="h-[96px] w-full" />
            <Skeleton className="h-[96px] w-full" />
          </div>
          <Skeleton className="h-[180px] w-full" />
        </div>
      </div>

      {/* Tables Skeleton */}
      <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
        <Skeleton className="h-[432px] w-full" />
        <Skeleton className="h-[432px] w-full" />
      </div>
    </div>
  );
}

function parseDebtEntryDescription(
  description: string | null | undefined,
  t: any
): { title: string; comment?: string | null } {
  if (!description) {
    return { title: t("debts.description") || "Долг" };
  }

  // 1. Shipments
  if (description.startsWith("Отгрузка ")) {
    const withoutArrow = description.split(" ->")[0];
    const productPart = withoutArrow.replace("Отгрузка ", "").trim();
    const title = `${t("debts.shipment")} ${productPart}`;
    
    let comment: string | null = null;
    const arrowParts = description.split(" ->");
    if (arrowParts.length > 1) {
      const rest = arrowParts[1].trim();
      const parenMatch = rest.match(/\(([^)]+)\)/);
      if (parenMatch) {
        comment = parenMatch[1];
      }
    }
    return { title, comment };
  }

  // 2. Purchases
  if (description.startsWith("Закупка ")) {
    const withoutParenthesis = description.split(" (")[0];
    const productPart = withoutParenthesis.replace("Закупка ", "").trim();
    const title = `${t("debts.purchase")} ${productPart}`;
    
    let comment: string | null = null;
    const parenMatch = description.match(/\(([^)]+)\)/);
    if (parenMatch) {
      comment = parenMatch[1];
    }
    return { title, comment };
  }

  // 3. Manual loans
  if (description.includes(":")) {
    const parts = description.split(":");
    const customComment = parts.slice(1).join(":").trim();
    
    let title = description;
    if (description.startsWith("Одолжили") || description.startsWith("Выдача")) {
      title = t("debts.lent");
    } else if (description.startsWith("Взяли") || description.startsWith("Получение")) {
      title = t("debts.borrowed");
    } else {
      title = parts[0].trim();
    }
    
    return {
      title,
      comment: customComment || null
    };
  }

  return { title: description };
}
