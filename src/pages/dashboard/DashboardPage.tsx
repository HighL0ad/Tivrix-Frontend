import {
  Area,
  AreaChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AlertCircle, Banknote, Boxes, ChartNoAxesColumnIncreasing, ChevronDown, ChevronUp, HandCoins, Landmark, Plus, ReceiptText, ShoppingCart, TrendingUp } from "lucide-react";
import { NavLink } from "react-router";
import { useTranslation } from "react-i18next";

import { useDashboard } from "@/entities/dashboard/api/use-dashboard";
import { money, shortDate } from "@/shared/lib/format";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { EmptyState } from "@/shared/ui/empty-state";
import { MetricCard } from "@/shared/ui/metric-card";
import { Money } from "@/shared/ui/money-display";
import { PageHeader } from "@/shared/ui/page-header";
import { PageError } from "@/shared/ui/page-state";
import { Skeleton } from "@/shared/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";

export function DashboardPage() {
  const { t } = useTranslation();
  const [profitPeriod, setProfitPeriod] = useState<"7d" | "30d" | "90d">("7d");
  const [isAlertsExpanded, setIsAlertsExpanded] = useState(false);
  const dashboardQuery = useDashboard();
  const data = dashboardQuery.data;

  if (dashboardQuery.isLoading) {
    return <DashboardSkeleton />;
  }

  if (!data) {
    return <PageError />;
  }

  const selectedProfitPeriod = data.profit_overview.periods[profitPeriod];
  const chartData = selectedProfitPeriod.profit_labels.map((label, index) => ({
    label: formatProfitAxisLabel(
      label,
      selectedProfitPeriod.profit_dates[index],
    ),
    tooltipLabel: formatProfitTooltipLabel(
      label,
      selectedProfitPeriod.profit_dates[index],
    ),
    profit: selectedProfitPeriod.profit_data[index] ?? 0,
  }));

  const hasExpiredAlerts = data.registration_alerts.some(a => a.days_remaining <= 0);

  return (
    <section className="space-y-5">
      <PageHeader
        title={t("app.nav.dashboard")}
        description={t("dashboard.description")}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title={t("dashboard.liveBalance")}
          value={<Money value={data.total_money} />}
          hint={t("dashboard.afterDebts", { amount: money(data.projected_balance) })}
          tone="violet"
          icon={<Banknote className="size-4" />}
        />
        <MetricCard
          title={t("dashboard.stockValue")}
          value={<Money value={data.stock_value} />}
          hint={t("dashboard.stockHint", { count: data.stock_count, total: money(data.projected_balance_with_stock) })}
          tone="info"
          icon={<Boxes className="size-4" />}
        />
        <MetricCard
          title={t("dashboard.profitToday")}
          value={<Money value={data.profit_today} />}
          hint={t("dashboard.soldCount", { count: data.sales_today.count })}
          tone={Number(data.profit_today) >= 0 ? "good" : "bad"}
          icon={<TrendingUp className="size-4" />}
        />
        <Card
          size="sm"
          className="relative border-gray-200 bg-white shadow-none before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-linear-to-r before:from-amber-400 before:to-orange-500"
        >
          <CardContent className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold uppercase tracking-wide text-gray-500">
                {t("dashboard.debtLoad")}
              </div>
              <div className="mt-2 space-y-0.5">
                <div className="flex items-baseline gap-2">
                  <span className="text-[10px] font-black uppercase text-gray-400 w-12 shrink-0">{t("dashboard.toUs", { amount: "" })}</span>
                  <span className="text-base font-black text-emerald-700 leading-tight">
                    <Money value={data.they_owe} />
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-[10px] font-black uppercase text-gray-400 w-12 shrink-0">{t("dashboard.fromUs", { amount: "" })}</span>
                  <span className="text-base font-black text-rose-700 leading-tight">
                    <Money value={data.we_owe} />
                  </span>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-white/80 bg-amber-50 p-2 text-amber-600 shadow-xs">
              <HandCoins className="size-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {data.registration_alerts.length > 0 && (
        <div className="space-y-3">
          <Alert variant={hasExpiredAlerts ? "destructive" : "warning"} className="block px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <AlertTitle className="mb-0 flex min-w-0 items-center gap-2 font-bold">
                <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
                <span className="min-w-0">
                  {data.registration_alerts.length === 1
                    ? (data.registration_alerts[0].days_remaining <= 0 ? t("dashboard.imeiExpired") : t("dashboard.imeiExpiringSoon", { days: data.registration_alerts[0].days_remaining }))
                    : t("dashboard.imeiAlertCount", { count: data.registration_alerts.length })}
                </span>
              </AlertTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 px-2 text-xs font-bold text-amber-800 hover:bg-amber-100 hover:text-amber-900"
                  onClick={() => setIsAlertsExpanded(!isAlertsExpanded)}
                >
                  {isAlertsExpanded ? t("common.hide") : t("common.show")}
                  {isAlertsExpanded ? <ChevronUp className="ml-1 size-3" /> : <ChevronDown className="ml-1 size-3" />}
                </Button>
            </div>
              {isAlertsExpanded && (
                <AlertDescription className="mt-3 border-t border-current/10 pt-3">
                  <div className="space-y-0">
                    {data.registration_alerts.map((alert) => (
                      <div key={alert.product_id} className="flex flex-col gap-2 border-b border-current/10 py-3 first:pt-0 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                        <span className="min-w-0">
                          <NavLink to={`/products/${alert.product_id}`} className="font-bold underline underline-offset-2 hover:bg-transparent hover:text-amber-950 hover:no-underline">
                            {alert.product_name}
                          </NavLink> (IMEI: {alert.imei})
                        </span>
                        <span className="shrink-0 text-[10px] font-bold uppercase opacity-80">
                          {alert.days_remaining <= 0 
                            ? t("dashboard.expired") 
                            : t("common.inNDays", { n: alert.days_remaining })} · {shortDate(alert.deadline_date)}
                        </span>
                      </div>
                    ))}
                  </div>
                </AlertDescription>
              )}
          </Alert>
        </div>
      )}

      <Card>
        <CardContent className="grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-5">
          <Button asChild>
            <NavLink to="/products/new"><Plus />{t("app.addProduct")}</NavLink>
          </Button>
          <Button asChild variant="outline">
            <NavLink to="/products?status=in_stock"><Boxes />{t("dashboard.inStock")}</NavLink>
          </Button>
          <Button asChild variant="outline">
            <NavLink to="/finance?tab=history"><ReceiptText />{t("finance.history")}</NavLink>
          </Button>
          <Button asChild variant="outline">
            <NavLink to="/finance?tab=profit"><ChartNoAxesColumnIncreasing />{t("finance.profit")}</NavLink>
          </Button>
          <Button asChild variant="outline">
            <NavLink to="/finance"><Banknote />{t("app.nav.finance")}</NavLink>
          </Button>
        </CardContent>
      </Card>

      <div className="grid items-start gap-4 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>{t("finance.profit")}</CardTitle>
              <div className="inline-flex w-fit items-center rounded-lg bg-muted p-1">
                {[
                  { value: "7d", label: t("dashboard.period.7dShort") },
                  { value: "30d", label: t("dashboard.period.30dShort") },
                  { value: "90d", label: t("dashboard.period.90dShort") },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
                      profitPeriod === option.value
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() =>
                      setProfitPeriod(option.value as "7d" | "30d" | "90d")
                    }
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <ColorMetric
                title={t("dashboard.netProfitFor", { period: periodLabel(profitPeriod, t) })}
                value={<Money value={selectedProfitPeriod.profit_total} />}
                hint={t("dashboard.saleMinusPurchase")}
                className="border-emerald-200 bg-emerald-50 text-emerald-800"
                icon={<ChartNoAxesColumnIncreasing className="size-4" />}
              />
              <ColorMetric
                title={t("dashboard.revenueFor", { period: periodLabel(profitPeriod, t) })}
                value={<Money value={selectedProfitPeriod.revenue_total} />}
                hint={t("dashboard.salesAmount")}
                className="border-sky-200 bg-sky-50 text-sky-800"
                icon={<Landmark className="size-4" />}
              />
              <ColorMetric
                title={t("dashboard.soldInDebt")}
                value={<Money value={selectedProfitPeriod.debt_sales_total} />}
                hint={t("dashboard.clientsAndPartners")}
                className="border-amber-200 bg-amber-50 text-amber-800"
                icon={<HandCoins className="size-4" />}
              />
              <ColorMetric
                title={t("dashboard.soldProducts")}
                value={t("common.pcs", { count: selectedProfitPeriod.sales_count })}
                hint={t("dashboard.closedSales")}
                className="border-violet-200 bg-violet-50 text-violet-800"
                icon={<ShoppingCart className="size-4" />}
              />
            </div>
            <ProfitChart data={chartData} period={profitPeriod} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.recentTransactions")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recent_transactions.map((tx) => (
              <div key={tx.id} className="rounded-lg border bg-white p-3 transition-colors hover:bg-sky-50/50">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="break-words text-sm font-semibold">{tx.display_description}</div>
                    <div className="mt-1 text-xs text-gray-500">{tx.operation_kind} · {tx.route_label}</div>
                    {tx.created_by_username ? (
                      <div className="mt-1 text-xs text-gray-500">
                        {t("common.user")}: {tx.created_by_username}
                      </div>
                    ) : null}
                    {[tx.from_wallet_name, tx.to_wallet_name, tx.product_name].filter(Boolean).length ? (
                      <div className="mt-1 text-xs text-gray-500">
                        {[tx.from_wallet_name, tx.to_wallet_name, tx.product_name].filter(Boolean).join(" · ")}
                      </div>
                    ) : null}
                  </div>
                  <div className="shrink-0 whitespace-nowrap text-right text-sm font-bold">
                    <Money value={tx.amount} />
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-400">{shortDate(tx.created_at)}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

type ProfitChartPoint = {
  label: string;
  tooltipLabel: string;
  profit: number;
};

function ProfitChart({
  data,
  period,
}: {
  data: ProfitChartPoint[];
  period: "7d" | "30d" | "90d";
}) {
  const { t } = useTranslation();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const height = width < 640 ? 220 : 280;

  useEffect(() => {
    const element = wrapperRef.current;
    if (!element) return;

    const updateWidth = () => {
      setWidth(Math.max(0, Math.floor(element.getBoundingClientRect().width)));
    };
    updateWidth();

    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(element);
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="mt-2 h-[220px] min-w-0 overflow-hidden sm:h-[280px]"
    >
      {data.length > 0 && width > 0 ? (
        <AreaChart
          width={width}
          height={height}
          data={data}
          margin={{ top: 14, right: 12, left: 0, bottom: 12 }}
        >
          <defs>
            <linearGradient id="profit" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="#0369a1" stopOpacity={0.28} />
              <stop offset="95%" stopColor="#0369a1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="label"
            interval={period === "7d" ? 0 : "preserveStartEnd"}
            minTickGap={width < 640 ? 18 : 28}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            padding={{ left: 8, right: 8 }}
          />
          <YAxis
            width={50}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => compactMoney(Number(value))}
          />
          <Tooltip
            content={<ProfitTooltip />}
            cursor={{ stroke: "#0369a1", strokeOpacity: 0.18, strokeWidth: 2 }}
          />
          <Area
            type="monotone"
            dataKey="profit"
            stroke="#0369a1"
            fill="url(#profit)"
            strokeWidth={2}
          />
        </AreaChart>
      ) : (
        <EmptyState
          className="h-full"
          title={t("dashboard.notEnoughData")}
          description={t("dashboard.emptyChart")}
        />
      )}
    </div>
  );
}

function periodLabel(value: "7d" | "30d" | "90d", t: (key: string) => string) {
  if (value === "7d") return t("dashboard.period.7d");
  if (value === "30d") return t("dashboard.period.30d");
  return t("dashboard.period.90d");
}

type ProfitTooltipPayload = {
  active?: boolean;
  payload?: Array<{
    value?: number | string;
    payload?: { tooltipLabel?: string };
  }>;
  label?: string | number;
};

function ProfitTooltip({ active, payload, label }: ProfitTooltipPayload) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-lg border bg-white px-3 py-2 text-sm shadow-lg">
      <div className="text-xs font-bold uppercase text-gray-500">
        {payload[0]?.payload?.tooltipLabel ?? label}
      </div>
      <div className="mt-1 font-black text-sky-700">
        <Money value={Number(payload[0]?.value ?? 0)} />
      </div>
    </div>
  );
}

function formatProfitAxisLabel(
  weekday: string,
  dateValue: string | undefined,
) {
  const dateLabel = formatShortChartDate(dateValue);
  if (!dateLabel) return weekday;
  return dateLabel;
}

function formatProfitTooltipLabel(weekday: string, dateValue: string | undefined) {
  const dateLabel = formatLongChartDate(dateValue);
  return dateLabel ? `${weekday}, ${dateLabel}` : weekday;
}

function formatShortChartDate(value: string | undefined) {
  if (!value) return "";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(value));
}

function formatLongChartDate(value: string | undefined) {
  if (!value) return "";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function compactMoney(value: number) {
  return value.toLocaleString("ru-RU", {
    maximumFractionDigits: 0,
  });
}

function ColorMetric({
  title,
  value,
  hint,
  className,
  icon,
}: {
  title: string;
  value: ReactNode;
  hint: string;
  className: string;
  icon: ReactNode;
}) {
  return (
    <div className={`rounded-lg border p-3 flex flex-col ${className}`}>
      <div className="flex items-start justify-between gap-3 min-h-[34px]">
        <div className="text-[11px] font-bold uppercase tracking-wide flex-1">{title}</div>
        <div className="shrink-0 pt-0.5 opacity-60">{icon}</div>
      </div>
      <div className="mt-2 text-lg font-black leading-none">{value}</div>
      <div className="mt-1.5 text-[11px] opacity-80 font-medium truncate">{hint}</div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} size="sm">
            <CardContent className="flex items-start justify-between gap-3 p-4">
              <div className="flex-1 space-y-3">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-10 w-10 rounded-lg" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>

      <div className="grid items-start gap-4 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-8 w-32 rounded-lg" />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
            <Skeleton className="h-[280px] w-full" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="mt-3 h-3 w-24" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
