import { Copy } from "lucide-react";
import { toast } from "sonner";

import {
  type Payable,
  useDebts,
} from "@/entities/debts/api/use-debts";
import type { Wallet } from "@/entities/finance/api/use-finance";
import { MoneyFlowDialog } from "@/features/debts/MoneyFlowDialog";
import { PayableDialog } from "@/features/debts/PayableDialog";
import { RepayDialog } from "@/features/debts/RepayDialog";
import { money, shortDate } from "@/shared/lib/format";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { EmptyState } from "@/shared/ui/empty-state";
import { PageHeader } from "@/shared/ui/page-header";
import { PageError, PageLoading } from "@/shared/ui/page-state";
import { ScrollArea } from "@/shared/ui/scroll-area";

export function DebtsPage() {
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
      title: "Мы должны",
      wallets: data.we_owe,
      operationType: "pay_supplier" as const,
    },
    {
      key: "shops" as const,
      title: "Нам должны магазины",
      wallets: data.shops_owe_us,
      operationType: "receive_client" as const,
    },
    {
      key: "clients" as const,
      title: "Нам должны клиенты",
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
        title="Долги"
        description="Поставщики, клиенты, партнёры и неоплаченные обязательства."
        actions={
          <>
        <MoneyFlowDialog
          title="Одолжить"
          trigger="Одолжить клиенту/партнёру"
          sourceWallets={data.my_wallets}
          targetWallets={data.lend_counterparties}
          mode="lend"
        />
        <MoneyFlowDialog
          title="Взять в долг"
          trigger="Взять в долг"
          sourceWallets={data.all_partners}
          targetWallets={data.my_wallets}
          mode="borrow"
        />
          </>
        }
      />

      {!hasAnyDebts ? (
        <EmptyState
          title="Долговых записей пока нет"
          description="Добавьте клиента, поставщика или оформите долг, чтобы быстро отслеживать взаиморасчёты."
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
            tone={section.operationType === "pay_supplier" ? "bad" : "good"}
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
  const total = sumPayables(payables);

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="flex flex-row items-center justify-between gap-3 border-b px-4 py-3">
        <CardTitle className="min-w-0 text-sm">Неоплаченные обязательства</CardTitle>
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
  payables,
  myWallets,
}: {
  payables: Payable[];
  myWallets: Wallet[];
}) {
  if (!payables.length) {
    return (
      <div className="px-4 py-8 text-center text-sm text-muted-foreground">
        Неоплаченных обязательств нет
      </div>
    );
  }

  return (
    <div>
      {payables.map((payable) => {
        const imeis = [payable.product_imei, payable.product_imei2].filter(Boolean);

        return (
          <div
            key={payable.id}
            className="grid grid-cols-[1fr_auto] items-center gap-3 border-b px-4 py-3 text-sm transition-colors last:border-b-0 hover:bg-muted/50"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div
                className="size-2.5 shrink-0 rounded-full bg-amber-500"
                aria-hidden="true"
              />
              <div className="min-w-0">
                <div className="break-words font-semibold">{payable.category}</div>
                <div className="mt-0.5 break-words text-xs text-muted-foreground">
                  {payable.product_name ?? "Без товара"}
                </div>
                {imeis.length ? (
                  <div className="mt-1 flex min-w-0 flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="break-all font-mono">IMEI: {imeis.join(" / ")}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7 shrink-0"
                      aria-label="Скопировать IMEI"
                      onClick={() => copyImei(imeis.join("\n"))}
                    >
                      <Copy className="size-3.5" aria-hidden="true" />
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="whitespace-nowrap font-bold text-amber-700">
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
  operationType: "pay_supplier" | "receive_client";
  tone: "good" | "bad";
}) {
  const total = sumWallets(wallets);
  const totalClass = tone === "bad"
    ? "border-rose-200 bg-rose-50 text-rose-700"
    : "border-emerald-200 bg-emerald-50 text-emerald-700";

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="flex flex-row items-center justify-between gap-3 border-b px-4 py-3">
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
  operationType: "pay_supplier" | "receive_client";
  tone: "good" | "bad";
}) {
  const dotClass = tone === "bad" ? "bg-rose-500" : "bg-emerald-500";
  const amountClass = tone === "bad" ? "text-rose-700" : "text-emerald-700";

  return (
    <div>
      {wallets.length ? wallets.map((wallet) => (
          <div
            key={wallet.id}
            className="grid grid-cols-[1fr_auto] items-center gap-3 border-b px-4 py-3 text-sm transition-colors last:border-b-0 hover:bg-muted/50"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div
                className={`size-2.5 shrink-0 rounded-full ${dotClass}`}
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
              <RepayDialog wallet={wallet} myWallets={myWallets} operationType={operationType} />
            </div>
          </div>
        )) : (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            {operationType === "pay_supplier"
              ? "Поставщики ещё не добавлены"
              : "Клиенты ещё не добавлены"}
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

async function copyImei(value: string) {
  await navigator.clipboard.writeText(value);
  toast.success("IMEI скопирован");
}
