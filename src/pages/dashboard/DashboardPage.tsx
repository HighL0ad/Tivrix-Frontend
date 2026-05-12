import {
  Area,
  AreaChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Banknote, Boxes, ChartNoAxesColumnIncreasing, HandCoins, Landmark, Plus, ReceiptText, ShoppingCart, TrendingUp } from "lucide-react";
import { NavLink } from "react-router";

import { useDashboard } from "@/entities/dashboard/api/use-dashboard";
import { money, shortDate } from "@/shared/lib/format";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { EmptyState } from "@/shared/ui/empty-state";
import { MetricCard } from "@/shared/ui/metric-card";
import { PageHeader } from "@/shared/ui/page-header";
import { PageError, PageLoading } from "@/shared/ui/page-state";

export function DashboardPage() {
  const [profitPeriod, setProfitPeriod] = useState<"7d" | "30d" | "90d">("7d");
  const dashboardQuery = useDashboard();
  const data = dashboardQuery.data;

  if (dashboardQuery.isLoading) {
    return <PageLoading />;
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

  return (
    <section className="space-y-5">
      <PageHeader
        title="Главная"
        description="Касса, склад, долги и прибыль в одном рабочем обзоре."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Живой баланс" value={money(data.total_money)} hint={`После долгов: ${money(data.projected_balance)}`} tone="violet" icon={<Banknote className="size-4" />} />
        <MetricCard title="Товар на складе" value={money(data.stock_value)} hint={`${data.stock_count} шт. · Итого: ${money(data.projected_balance_with_stock)}`} tone="info" icon={<Boxes className="size-4" />} />
        <MetricCard
          title="Прибыль сегодня"
          value={money(data.profit_today)}
          tone={Number(data.profit_today) >= 0 ? "good" : "bad"}
          icon={<TrendingUp className="size-4" />}
        />
        <Card
          size="sm"
          className="relative border-amber-200 bg-white shadow-none before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-linear-to-r before:from-amber-400 before:to-orange-500"
        >
          <CardContent className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs font-bold uppercase tracking-wide text-gray-500">
                Долговая нагрузка
              </div>
              <div className="mt-2 space-y-1 text-xs font-bold">
                <div className="text-emerald-600">Нам: +{money(data.they_owe)}</div>
                <div className="text-rose-500">Мы: -{money(data.we_owe)}</div>
              </div>
            </div>
            <div className="rounded-lg border border-white/80 bg-amber-100 p-2 text-amber-700 shadow-sm">
              <HandCoins className="size-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-5">
          <Button asChild>
            <NavLink to="/products/new"><Plus />Добавить товар</NavLink>
          </Button>
          <Button asChild variant="outline">
            <NavLink to="/products?status=in_stock"><Boxes />Товары в наличии</NavLink>
          </Button>
          <Button asChild variant="outline">
            <NavLink to="/finance?tab=history"><ReceiptText />История операций</NavLink>
          </Button>
          <Button asChild variant="outline">
            <NavLink to="/finance?tab=profit"><ChartNoAxesColumnIncreasing />Прибыль</NavLink>
          </Button>
          <Button asChild variant="outline">
            <NavLink to="/finance"><Banknote />Касса</NavLink>
          </Button>
        </CardContent>
      </Card>

      <div className="grid items-start gap-4 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Прибыль</CardTitle>
              <div className="inline-flex w-fit items-center rounded-lg bg-muted p-1">
                {[
                  { value: "7d", label: "7д" },
                  { value: "30d", label: "30д" },
                  { value: "90d", label: "90д" },
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
                title={`Чистая прибыль за ${periodLabel(profitPeriod)}`}
                value={money(selectedProfitPeriod.profit_total)}
                hint="Продажа минус закупка"
                className="border-emerald-200 bg-emerald-50 text-emerald-800"
                icon={<ChartNoAxesColumnIncreasing className="size-4" />}
              />
              <ColorMetric
                title={`Выручка за ${periodLabel(profitPeriod)}`}
                value={money(selectedProfitPeriod.revenue_total)}
                hint="Сумма продаж"
                className="border-sky-200 bg-sky-50 text-sky-800"
                icon={<Landmark className="size-4" />}
              />
              <ColorMetric
                title="Продано в долг"
                value={money(selectedProfitPeriod.debt_sales_total)}
                hint="Клиенты и партнёры"
                className="border-amber-200 bg-amber-50 text-amber-800"
                icon={<HandCoins className="size-4" />}
              />
              <ColorMetric
                title="Продано товаров"
                value={`${selectedProfitPeriod.sales_count} шт.`}
                hint="Закрытые продажи"
                className="border-violet-200 bg-violet-50 text-violet-800"
                icon={<ShoppingCart className="size-4" />}
              />
            </div>
            <ProfitChart data={chartData} period={profitPeriod} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Последние операции</CardTitle>
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
                        пользователь: {tx.created_by_username}
                      </div>
                    ) : null}
                    {[tx.from_wallet_name, tx.to_wallet_name, tx.product_name].filter(Boolean).length ? (
                      <div className="mt-1 text-xs text-gray-500">
                        {[tx.from_wallet_name, tx.to_wallet_name, tx.product_name].filter(Boolean).join(" · ")}
                      </div>
                    ) : null}
                  </div>
                  <div className="shrink-0 whitespace-nowrap text-right text-sm font-bold">
                    {money(tx.amount)}
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
          title="Недостаточно данных"
          description="За выбранный период график пока пуст."
        />
      )}
    </div>
  );
}

function periodLabel(value: "7d" | "30d" | "90d") {
  if (value === "7d") return "7 дней";
  if (value === "30d") return "30 дней";
  return "90 дней";
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
        {money(Number(payload[0]?.value ?? 0))}
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
  value: string;
  hint: string;
  className: string;
  icon: ReactNode;
}) {
  return (
    <div className={`rounded-lg border p-3 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] font-bold uppercase tracking-wide">{title}</div>
        {icon}
      </div>
      <div className="mt-2 text-lg font-black">{value}</div>
      <div className="mt-1 text-xs opacity-80">{hint}</div>
    </div>
  );
}
