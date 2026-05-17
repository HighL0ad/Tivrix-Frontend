import { useEffect, useState, type ReactNode } from "react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { Banknote, CalendarDays, HandCoins, RotateCcw, Search, ShieldAlert, SunMedium, TrendingDown, TrendingUp, WalletCards } from "lucide-react";
import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import { useCurrentUser } from "@/entities/auth/api/use-current-user";
import {
  useExpenses,
  useFinance,
  useProfit,
  useUndoSaleTransaction,
  useUndoTransaction,
} from "@/entities/finance/api/use-finance";
import type { Transaction } from "@/entities/dashboard/api/use-dashboard";
import { AdjustWalletDialog } from "@/features/finance/AdjustWalletDialog";
import { getSaleSourceLabel } from "@/features/products/product-display/format";
import { TransferDialog } from "@/features/finance/TransferDialog";
import { getApiErrorMessage } from "@/shared/api/error";
import { money, shortDate } from "@/shared/lib/format";
import { walletTypeLabel } from "@/shared/lib/wallet-labels";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/ui/alert-dialog";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { DatePicker } from "@/shared/ui/date-picker";
import { Input } from "@/shared/ui/input";
import { MetricCard } from "@/shared/ui/metric-card";
import { PageHeader } from "@/shared/ui/page-header";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/shared/ui/pagination";
import { PageError, PageLoading } from "@/shared/ui/page-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";

const financeTabValues = ["overview", "history", "profit", "expenses"] as const;
const financeActionValues = ["transfer", "adjust"] as const;

export function FinancePage() {
  const { t } = useTranslation();
  const [{ q, page, tab, action, walletId, profitFrom, profitTo, expensesFrom, expensesTo }, setFinanceParams] = useQueryStates({
    q: parseAsString.withDefault(""),
    page: parseAsInteger.withDefault(1),
    tab: parseAsStringLiteral(financeTabValues).withDefault("overview"),
    action: parseAsStringLiteral(financeActionValues),
    walletId: parseAsInteger,
    profitFrom: parseAsString.withDefault(""),
    profitTo: parseAsString.withDefault(""),
    expensesFrom: parseAsString.withDefault(""),
    expensesTo: parseAsString.withDefault(""),
  });
  const [search, setSearch] = useState(q);
  const currentUser = useCurrentUser().data;
  const operationPermissions = currentUser?.operation_permissions;
  const canViewHistory = Boolean(operationPermissions?.can_view_finance_history);
  const canViewProfit = Boolean(operationPermissions?.can_view_finance_profit);
  const canViewExpenses = Boolean(operationPermissions?.can_view_finance_expenses);
  const canTransferWallets = Boolean(operationPermissions?.can_transfer_wallets);
  const canAdjustWallets = Boolean(operationPermissions?.can_adjust_wallets);
  const canUndoTransactions = Boolean(operationPermissions?.can_undo_transactions);
  const financeQuery = useFinance({ q, page });
  const profitQuery = useProfit({
    date_from: profitFrom,
    date_to: profitTo,
    enabled: canViewProfit,
  });
  const expensesQuery = useExpenses({
    date_from: expensesFrom,
    date_to: expensesTo,
    enabled: canViewExpenses,
  });
  const undoTransaction = useUndoTransaction();
  const undoSaleTransaction = useUndoSaleTransaction();
  const data = financeQuery.data;

  const activeAdjustWallet =
    data?.my_wallets.find((w) => w.id === walletId) || data?.my_wallets[0];

  useEffect(() => {
    setSearch(q);
  }, [q]);

  function setPage(nextPage: number) {
    setFinanceParams({ page: nextPage <= 1 ? 1 : nextPage });
  }

  function updateFinanceParams(next: {
    q?: string;
    page?: number;
    tab?: (typeof financeTabValues)[number];
  }) {
    setFinanceParams({
      q: next.q === undefined ? q : next.q.trim(),
      page: next.q !== undefined || next.tab !== undefined ? 1 : next.page,
      tab: next.tab ?? tab,
    });
  }

  if (financeQuery.isLoading) {
    return <PageLoading />;
  }

  if (!data) {
    return <PageError />;
  }

  return (
    <section className="space-y-5">
      <PageHeader
        title={t("app.nav.finance")}
        description={t("finance.description")}
        actions={
          canTransferWallets ? (
            <TransferDialog
              wallets={data.my_wallets}
              open={action === "transfer"}
              onOpenChange={(open) => setFinanceParams({ action: open ? "transfer" : null })}
            />
          ) : null
        }
      />

      <Card className="border-violet-200 bg-linear-to-r from-violet-600 to-indigo-700 text-white">
        <CardContent className="flex flex-col gap-2 p-6">
          <div className="text-sm font-bold uppercase tracking-wide text-violet-100">
            {t("finance.allTimeNetProfit")}
          </div>
          <div className="text-4xl font-black tracking-tight">
            {money(data.total_profit)}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title={t("finance.onHand")} value={money(data.position.cash_total)} hint={t("finance.cashCardsAccounts")} tone="info" icon={<WalletCards className="size-4" />} />
        <MetricCard title={t("finance.receivable")} value={money(data.position.receivable_total)} tone="good" icon={<TrendingUp className="size-4" />} />
        <MetricCard title={t("finance.payable")} value={money(data.position.owed_total)} tone="bad" icon={<TrendingDown className="size-4" />} />
        <MetricCard title={t("finance.netAfterDebts")} value={money(data.position.net_balance)} tone={Number(data.position.net_balance) >= 0 ? "good" : "bad"} icon={<Banknote className="size-4" />} />
      </div>

      <Tabs
        value={tab}
        onValueChange={(value) =>
          updateFinanceParams({ tab: value as (typeof financeTabValues)[number] })
        }
      >
        <TabsList>
          <TabsTrigger value="overview">{t("finance.overview")}</TabsTrigger>
          <TabsTrigger value="history">{t("finance.historyShort")}</TabsTrigger>
          <TabsTrigger value="profit">{t("finance.profit")}</TabsTrigger>
          <TabsTrigger value="expenses">{t("finance.expenses")}</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <OverviewCard
            data={data}
            canAdjustWallets={canAdjustWallets}
            adjustWalletId={action === "adjust" ? activeAdjustWallet?.id : undefined}
            onAdjustOpenChange={(open, id) =>
              setFinanceParams({
                action: open ? "adjust" : null,
                walletId: open ? id : null,
              })
            }
          />
        </TabsContent>
        <TabsContent value="history">
          {canViewHistory ? (
            <HistoryCard
            search={search}
            setSearch={setSearch}
            currentQuery={q}
            updateFinanceParams={updateFinanceParams}
            data={data}
            page={page}
            setPage={setPage}
            onUndo={(transactionId) =>
              undoTransaction.mutate(transactionId, {
                onSuccess: () => toast.success(t("finance.operationUndone")),
                onError: (error) => toast.error(getApiErrorMessage(error)),
              })
            }
            onUndoSale={(transactionId) =>
              undoSaleTransaction.mutate(transactionId, {
                onSuccess: () => toast.success(t("products.saleUndone")),
                onError: (error) => toast.error(getApiErrorMessage(error)),
              })
            }
            canUndoTransactions={canUndoTransactions}
            undoPending={undoTransaction.isPending || undoSaleTransaction.isPending}
          />
          ) : (
            <FinancePermissionBlock title={t("finance.historyClosed")} />
          )}
        </TabsContent>
        <TabsContent value="profit">
          {canViewProfit ? (
            <ProfitCard
            data={profitQuery.data}
            dateFrom={profitFrom}
            dateTo={profitTo}
            setDateRange={(nextFrom, nextTo) =>
              setFinanceParams({ profitFrom: nextFrom, profitTo: nextTo })
            }
          />
          ) : (
            <FinancePermissionBlock title={t("finance.profitClosed")} />
          )}
        </TabsContent>
        <TabsContent value="expenses">
          {canViewExpenses ? (
            <ExpensesCard
            data={expensesQuery.data}
            dateFrom={expensesFrom}
            dateTo={expensesTo}
            setDateRange={(nextFrom, nextTo) =>
              setFinanceParams({ expensesFrom: nextFrom, expensesTo: nextTo })
            }
          />
          ) : (
            <FinancePermissionBlock title={t("finance.expensesClosed")} />
          )}
        </TabsContent>
      </Tabs>
    </section>
  );
}

function HistoryCard({
  search,
  setSearch,
  currentQuery,
  updateFinanceParams,
  data,
  page,
  setPage,
  onUndo,
  onUndoSale,
  canUndoTransactions,
  undoPending,
}: {
  search: string;
  setSearch: (value: string) => void;
  currentQuery: string;
  updateFinanceParams: (next: {
    q?: string;
    page?: number;
    tab?: (typeof financeTabValues)[number];
  }) => void;
  data: NonNullable<ReturnType<typeof useFinance>["data"]>;
  page: number;
  setPage: (page: number) => void;
  onUndo: (transactionId: number) => void;
  onUndoSale: (transactionId: number) => void;
  canUndoTransactions: boolean;
  undoPending: boolean;
}) {
  const { t } = useTranslation();
  const [sorting, setSorting] = useState<SortingState>([
    { id: "created_at", desc: true },
  ]);
  const columns: ColumnDef<Transaction>[] = [
    {
      accessorKey: "display_description",
      header: t("finance.operation"),
      cell: ({ row }) => (
        <div>
          <div className="max-w-md whitespace-normal font-semibold">
            {row.original.display_description}
          </div>
          <div className="text-xs text-gray-500">{row.original.operation_kind}</div>
          {row.original.created_by_username ? (
            <div className="mt-1 text-xs text-gray-500">
              {t("common.user")}: {row.original.created_by_username}
            </div>
          ) : null}
          <div className="mt-1 text-xs text-gray-500">
            {[row.original.product_name, row.original.from_wallet_name, row.original.to_wallet_name]
              .filter(Boolean)
              .join(" · ")}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "route_label",
      header: t("finance.route"),
      cell: ({ row }) => (
        <div className="max-w-64 whitespace-normal text-muted-foreground">
          {row.original.route_label}
        </div>
      ),
    },
    {
      accessorKey: "created_at",
      header: t("finance.date"),
      sortingFn: (a, b) =>
        new Date(a.original.created_at ?? 0).getTime() -
        new Date(b.original.created_at ?? 0).getTime(),
      cell: ({ row }) => shortDate(row.original.created_at),
    },
    {
      accessorKey: "amount",
      header: () => <div className="text-right">{t("finance.amount")}</div>,
      sortingFn: (a, b) =>
        Number(a.original.amount) - Number(b.original.amount),
      cell: ({ row }) => (
        <div className="text-right font-bold">{money(row.original.amount)}</div>
      ),
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) =>
        canUndoTransactions && (row.original.can_undo || row.original.can_undo_sale) ? (
          <AlertDialog>
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={undoPending}
                    className="h-8 rounded-full border-transparent bg-muted px-3 text-xs font-bold text-muted-foreground shadow-none transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                    aria-label={t("finance.undo")}
                  >
                    <RotateCcw aria-hidden="true" />
                    {t("finance.undo")}
                  </Button>
                </AlertDialogTrigger>
              </TooltipTrigger>
              <TooltipContent>{t("finance.undo")}</TooltipContent>
            </Tooltip>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("finance.undoOperationTitle")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {row.original.can_undo_sale
                    ? t("finance.undoSaleDescription")
                    : t("finance.undoOperationDescription")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("common.no")}</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-50 text-red-700 hover:bg-red-100"
                  onClick={() =>
                    row.original.can_undo_sale
                      ? onUndoSale(row.original.id)
                      : onUndo(row.original.id)
                  }
                >
                  {t("finance.confirmUndo")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : row.original.undo_disabled_reason ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="button" size="sm" variant="outline" disabled className="h-8">
                <RotateCcw aria-hidden="true" />
                {t("common.unavailable")}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{row.original.undo_disabled_reason}</TooltipContent>
          </Tooltip>
        ) : null,
    },
  ];
  const table = useReactTable({
    data: data.transactions,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <Card>
      <CardHeader className="gap-3">
        <CardTitle>{t("finance.historyShort")}</CardTitle>
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            updateFinanceParams({ q: search });
          }}
        >
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-9"
              placeholder={t("finance.searchTransactions")}
            />
          </div>
          <Button type="submit">{t("common.searchButton")}</Button>
          {currentQuery ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSearch("");
                updateFinanceParams({ q: "" });
              }}
            >
              {t("common.reset")}
            </Button>
          ) : null}
        </form>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 font-bold"
                        disabled={!header.column.getCanSort()}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {header.column.getIsSorted() === "asc" ? "↑" : null}
                        {header.column.getIsSorted() === "desc" ? "↓" : null}
                      </button>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="mt-4 flex flex-col gap-3 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between">
          <span className="shrink-0 whitespace-nowrap">
            {t("common.pageOf", { page: data.transactions_page, total: data.transactions_total_pages })}
          </span>
          <Pagination className="shrink-0">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  disabled={page <= 1}
                  onClick={(event) => {
                    event.preventDefault();
                    setPage(page - 1);
                  }}
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  disabled={page >= data.transactions_total_pages}
                  onClick={(event) => {
                    event.preventDefault();
                    setPage(page + 1);
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </CardContent>
    </Card>
  );
}

function OverviewCard({
  data,
  canAdjustWallets,
  adjustWalletId,
  onAdjustOpenChange,
}: {
  data: NonNullable<ReturnType<typeof useFinance>["data"]>;
  canAdjustWallets: boolean;
  adjustWalletId?: number;
  onAdjustOpenChange: (open: boolean, walletId: number) => void;
}) {
  const { t } = useTranslation();
  const nonZeroWallets = data.my_wallets.filter((wallet) => Number(wallet.balance) !== 0);

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>{t("finance.periods")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid md:grid-cols-3">
            <PeriodBlock title={t("finance.today")} summary={data.today} icon={<SunMedium className="size-3.5" />} accentClassName="bg-slate-400" />
            <PeriodBlock title={t("finance.week")} summary={data.week} icon={<CalendarDays className="size-3.5" />} accentClassName="bg-sky-500" />
            <PeriodBlock title={t("finance.month")} summary={data.month} icon={<CalendarDays className="size-3.5" />} accentClassName="bg-emerald-500" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t("finance.walletBalances")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {nonZeroWallets.length ? nonZeroWallets.map((wallet) => (
            <div key={wallet.id} className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
              <div className="min-w-0">
                <div className="truncate font-semibold">{wallet.name}</div>
                <div className="text-xs text-muted-foreground">{walletTypeLabel(wallet.type)}</div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <div className="font-bold">{money(wallet.balance)}</div>
                {canAdjustWallets ? (
                  <AdjustWalletDialog
                    wallet={wallet}
                    open={adjustWalletId === wallet.id}
                    onOpenChange={(open) => onAdjustOpenChange(open, wallet.id)}
                  />
                ) : null}
              </div>
            </div>
          )) : (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              {t("catalogs.walletsEmptyTitle")}
            </div>
          )}
        </CardContent>
      </Card>
      <Card className="xl:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HandCoins className="size-5 text-rose-600" />
            {t("finance.supplierDebts")}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {data.debt_wallets.length ? data.debt_wallets.map((wallet) => (
            <div key={wallet.id} className="flex items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
              <span className="font-semibold">{wallet.name}</span>
              <span className="font-bold">{money(wallet.balance)}</span>
            </div>
          )) : (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-center text-sm font-semibold text-emerald-700 sm:col-span-2 lg:col-span-3">
              {t("finance.noSupplierDebts")}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function FinancePermissionBlock({ title }: { title: string }) {
  const { t } = useTranslation();
  return (
    <Card className="border-amber-200 bg-amber-50/50">
      <CardContent className="flex min-h-64 flex-col items-center justify-center px-6 py-10 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <ShieldAlert className="size-6" />
        </span>
        <h2 className="mt-4 text-lg font-black text-foreground">{title}</h2>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          {t("finance.permissionRestricted")}
        </p>
      </CardContent>
    </Card>
  );
}

function PeriodBlock({
  title,
  summary,
  icon,
  accentClassName,
}: {
  title: string;
  summary: NonNullable<ReturnType<typeof useFinance>["data"]>["today"];
  icon: ReactNode;
  accentClassName: string;
}) {
  const { t } = useTranslation();
  return (
    <div className="border-t border-gray-200 bg-muted/20 p-5 first:border-t-0 md:border-l md:border-t-0 md:first:border-l-0">
      <div className={`mb-4 h-0.5 w-full rounded-full ${accentClassName}`} />
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-600">
        <span className="text-sky-700">{icon}</span>
        {title}
      </div>
      <div className="mt-4 space-y-2 text-sm">
        <MetricLine label={t("finance.incomes")} value={money(summary.income)} tone="good" />
        <MetricLine label={t("finance.expenses")} value={money(summary.expenses)} tone="bad" />
        <MetricLine label={t("finance.profit")} value={money(summary.profit)} />
        <MetricLine label={t("finance.operations")} value={String(summary.operations_count)} />
      </div>
    </div>
  );
}

function ProfitCard({
  data,
  dateFrom,
  dateTo,
  setDateRange,
}: {
  data: ReturnType<typeof useProfit>["data"];
  dateFrom: string;
  dateTo: string;
  setDateRange: (dateFrom: string, dateTo: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader className="gap-3">
        <CardTitle>{t("finance.profit")}</CardTitle>
        <DateFilters
          dateFrom={dateFrom}
          dateTo={dateTo}
          setDateRange={setDateRange}
        />
        <div className="text-xs font-medium text-muted-foreground">
          {periodLabel(dateFrom, dateTo, t)}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {data ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <InlineMetric title={t("finance.today")} value={money(data.today.profit)} />
              <InlineMetric title={t("finance.week")} value={money(data.week.profit)} />
              <InlineMetric title={t("finance.month")} value={money(data.month.profit)} />
              <InlineMetric title={t("finance.total")} value={money(data.all_time.profit)} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <InlineMetric title={t("finance.netForPeriod")} value={money(data.selected_period.profit)} />
              <InlineMetric title={t("finance.cost")} value={money(data.selected_period.buy_total)} />
              <InlineMetric title={t("finance.margin")} value={`${Number(data.selected_period.margin_percent).toFixed(1)}%`} />
              <InlineMetric title={t("finance.averageProfit")} value={money(data.avg_profit_per_sale)} />
            </div>
            {data.best_sale ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm">
                <div className="font-bold text-emerald-900">{t("finance.bestSale")}</div>
                <div className="mt-1 flex justify-between gap-3">
                  <span>{data.best_sale.product_name}</span>
                  <span className={`font-bold ${profitToneClass(data.best_sale.profit)}`}>
                    {money(data.best_sale.profit)}
                  </span>
                </div>
              </div>
            ) : null}
            <div className="space-y-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("sell.product")}</TableHead>
                    <TableHead>{t("products.soldAt")}</TableHead>
                    <TableHead className="text-right">{t("sell.purchase")}</TableHead>
                    <TableHead className="text-right">{t("products.sale")}</TableHead>
                    <TableHead className="text-right">{t("finance.profit")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recent_sales.map((sale, index) => (
                    <TableRow key={`${sale.product_name}-${index}`}>
                      <TableCell>
                        <div className="font-semibold">{sale.product_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {sale.client_name || t("finance.noName")}
                        </div>
                      </TableCell>
                      <TableCell>{shortDate(sale.sold_at)}</TableCell>
                      <TableCell className="text-right font-medium">{money(sale.buy_price)}</TableCell>
                      <TableCell className="text-right font-medium">{money(sale.total_price)}</TableCell>
                      <TableCell className={`text-right font-bold ${profitToneClass(sale.profit)}`}>
                        {money(sale.profit)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!data.recent_sales.length ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                        {t("finance.noSalesForPeriod")}
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>
            {data.source_stats.length ? (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {data.source_stats.map((source) => (
                  <div key={source.source ?? source.label} className="rounded-lg border p-3 text-sm">
                    <div className="font-semibold">
                      {source.source ? getSaleSourceLabel(source.source) : t("products.notSpecified")}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{t("finance.salesCount", { count: source.count })}</div>
                    <div className="mt-2 font-bold">{money(source.profit)}</div>
                  </div>
                ))}
              </div>
            ) : null}
          </>
        ) : (
          <div className="text-sm text-gray-500">{t("finance.loadingProfit")}</div>
        )}
      </CardContent>
    </Card>
  );
}

function ExpensesCard({
  data,
  dateFrom,
  dateTo,
  setDateRange,
}: {
  data: ReturnType<typeof useExpenses>["data"];
  dateFrom: string;
  dateTo: string;
  setDateRange: (dateFrom: string, dateTo: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader className="gap-3">
        <CardTitle>{t("finance.expenses")}</CardTitle>
        <DateFilters
          dateFrom={dateFrom}
          dateTo={dateTo}
          setDateRange={setDateRange}
        />
        <div className="text-xs font-medium text-muted-foreground">
          {periodLabel(dateFrom, dateTo, t)}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {data ? (
          <>
            <InlineMetric title={t("finance.totalExpenses")} value={money(data.total)} />
            <InlineMetric title={t("finance.operations")} value={String(data.items.length)} />
            <div className="max-h-[60vh] space-y-2 overflow-auto pr-1">
              {data.items.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm"
                >
                  <div>
                    <div className="font-semibold">{expense.description}</div>
                    <div className="text-xs text-gray-500">
                      {expense.wallet_name} · {shortDate(expense.created_at)}
                    </div>
                  </div>
                  <div className="font-bold">
                    {money(Math.abs(Number(expense.amount)))}
                  </div>
                </div>
              ))}
              {!data.items.length ? (
                <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                  {t("finance.noExpensesForPeriod")}
                </div>
              ) : null}
            </div>
          </>
        ) : (
          <div className="text-sm text-gray-500">{t("finance.loadingExpenses")}</div>
        )}
      </CardContent>
    </Card>
  );
}

function DateFilters({
  dateFrom,
  dateTo,
  setDateRange,
}: {
  dateFrom: string;
  dateTo: string;
  setDateRange: (dateFrom: string, dateTo: string) => void;
}) {
  const { t } = useTranslation();
  function updateRange(nextFrom: string, nextTo: string) {
    const normalized = normalizeDateRange(nextFrom, nextTo);
    setDateRange(normalized.dateFrom, normalized.dateTo);
  }

  return (
    <div className="grid gap-2 sm:grid-cols-[180px_180px_auto]">
      <DatePicker
        value={dateFrom}
        onChange={(value) => updateRange(value, dateTo)}
        placeholder={t("finance.dateFrom")}
      />
      <DatePicker
        value={dateTo}
        onChange={(value) => updateRange(dateFrom, value)}
        placeholder={t("finance.dateTo")}
      />
      <Button type="button" variant="outline" onClick={() => setDateRange("", "")}>
        {t("common.reset")}
      </Button>
    </div>
  );
}

function normalizeDateRange(dateFrom: string, dateTo: string) {
  if (dateFrom && dateTo && dateFrom > dateTo) {
    return { dateFrom: dateTo, dateTo: dateFrom };
  }

  return { dateFrom, dateTo };
}

function periodLabel(dateFrom: string, dateTo: string, t: (key: string, options?: Record<string, string>) => string) {
  if (dateFrom && dateTo) return t("finance.periodRange", { dateFrom, dateTo });
  if (dateFrom) return t("finance.periodFrom", { dateFrom });
  if (dateTo) return t("finance.periodTo", { dateTo });
  return t("finance.periodAllTime");
}

function profitToneClass(value: string | number) {
  return Number(value) >= 0 ? "text-emerald-700" : "text-rose-600";
}

function MetricLine({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "good" | "bad";
}) {
  const className = tone === "good" ? "text-emerald-700" : tone === "bad" ? "text-rose-600" : "text-gray-950";
  return (
    <div className="flex justify-between gap-3 border-b border-gray-200 pb-1 last:border-b-0">
      <span className="text-gray-500">{label}</span>
      <span className={`font-bold ${className}`}>{value}</span>
    </div>
  );
}
function InlineMetric({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/40 px-3 py-3">
      <div className="text-xs font-bold uppercase tracking-wide text-gray-500">{title}</div>
      <div className="mt-1 break-words text-lg font-black text-gray-950">{value}</div>
    </div>
  );
}
