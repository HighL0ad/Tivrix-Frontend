import { Copy, ChevronDown, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { parseAsStringLiteral, useQueryStates } from "nuqs";

import {
  type RepaymentOperationType,
  type Payable,
  useDebts,
} from "@/entities/debts/api/use-debts";
import type { Wallet } from "@/entities/finance/api/use-finance";
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

const debtsActionValues = ["lend", "borrow"] as const;

export function DebtsPage() {
  const { t } = useTranslation();
  const [{ action }, setDebtsParams] = useQueryStates({
    action: parseAsStringLiteral(debtsActionValues),
  });
  const debtsQuery = useDebts();

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
  return (
    <section className="space-y-5">
      <PageHeader
        title={t("app.nav.debts")}
        description={t("debts.description")}
        actions={
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
        }
      />

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
    <Card className="gap-0 py-0">
      <CardHeader className="flex flex-row items-center justify-between gap-3 border-b px-4 py-3">
        <CardTitle className="min-w-0 text-sm">{t("debts.unpaidPayables")}</CardTitle>
        <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
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
                  <span className="font-semibold">{payable.category}</span>
                  <span className="text-xs text-muted-foreground">
                    {payable.product_name ?? t("products.noProduct")}
                  </span>
                </div>

                {payable.due_at ? (
                  <div
                    className={`mt-1 flex items-center gap-1.5 text-xs font-medium ${
                      isOverdue
                        ? "text-rose-600"
                        : isDueSoon
                          ? "text-amber-600"
                          : "text-muted-foreground"
                    }`}
                  >
                    <CalendarDays className="size-3.5" />
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
              <PayableDialog payable={payable} wallets={myWallets} />
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
  wallets: Wallet[];
  myWallets: Wallet[];
  debtCreatedAt: Record<string, string>;
  operationType: RepaymentOperationType;
  tone: DebtTone;
}) {
  const total = sumWallets(wallets);
  const totalClass = {
    bad: "border-rose-200 bg-rose-50 text-rose-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    good: "border-emerald-200 bg-emerald-50 text-emerald-700",
  }[tone];
  const cardClass = tone === "blue" ? "gap-0 border-blue-200 py-0" : "gap-0 py-0";
  const headerClass = tone === "blue"
    ? "flex flex-row items-center justify-between gap-3 border-b border-blue-200 bg-blue-50/50 px-4 py-3"
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

function WalletRows({
  wallets,
  myWallets,
  debtCreatedAt,
  operationType,
  tone,
}: {
  wallets: Wallet[];
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
      {wallets.length ? wallets.map((wallet) => (
          <div
            key={wallet.id}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b px-4 py-3 text-sm transition-colors last:border-b-0 hover:bg-muted/50"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div
                className={`size-2.5 shrink-0 rounded-full animate-pulse ${dotClass}`}
                aria-hidden="true"
              />
              <div className="min-w-0">
                <div className="break-words font-semibold">{wallet.name}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {shortDate(debtCreatedAt[String(wallet.id)])}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
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
        )) : (
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
