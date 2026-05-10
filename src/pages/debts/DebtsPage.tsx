import { useRef, useState } from "react";
import { toast } from "sonner";

import {
  useCreateDebtWallet,
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
import { Input } from "@/shared/ui/input";
import { PageHeader } from "@/shared/ui/page-header";
import { PageError, PageLoading } from "@/shared/ui/page-state";
import { ScrollArea } from "@/shared/ui/scroll-area";

export function DebtsPage() {
  const debtsQuery = useDebts();
  const createWallet = useCreateDebtWallet();
  const [clientName, setClientName] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const clientInputRef = useRef<HTMLInputElement>(null);
  const supplierInputRef = useRef<HTMLInputElement>(null);

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
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button type="button" onClick={() => clientInputRef.current?.focus()}>
                Добавить клиента
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => supplierInputRef.current?.focus()}
              >
                Добавить поставщика
              </Button>
            </div>
          }
        />
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Быстро добавить</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              if (!clientName.trim()) return;
              createWallet.mutate(
                { name: clientName.trim(), wallet_type: "client_debt" },
                {
                  onSuccess: () => {
                    setClientName("");
                    toast.success("Клиент добавлен");
                  },
                },
              );
            }}
          >
            <Input ref={clientInputRef} value={clientName} onChange={(event) => setClientName(event.target.value)} placeholder="Имя клиента" />
            <Button type="submit" disabled={!clientName.trim() || createWallet.isPending}>
              Добавить клиента
            </Button>
          </form>
          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              if (!supplierName.trim()) return;
              createWallet.mutate(
                { name: supplierName.trim(), wallet_type: "debt" },
                {
                  onSuccess: () => {
                    setSupplierName("");
                    toast.success("Поставщик добавлен");
                  },
                },
              );
            }}
          >
            <Input ref={supplierInputRef} value={supplierName} onChange={(event) => setSupplierName(event.target.value)} placeholder="Поставщик / партнёр" />
            <Button type="submit" variant="outline" disabled={!supplierName.trim() || createWallet.isPending}>
              Добавить поставщика
            </Button>
          </form>
        </CardContent>
      </Card>

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

      <Card>
        <CardHeader>
          <CardTitle>Неоплаченные обязательства</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.unpaid_payables.length ? data.unpaid_payables.map((payable) => (
            <div key={payable.id} className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm transition-colors hover:bg-sky-50/50">
              <div>
                <div className="font-semibold">{payable.category}</div>
                <div className="text-xs text-gray-500">{payable.product_name ?? "Без товара"}</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="font-bold">{money(payable.amount)}</div>
                <PayableDialog payable={payable} wallets={data.my_wallets} />
              </div>
            </div>
          )) : (
            <EmptyState
              className="py-8"
              title="Неоплаченных обязательств нет"
              description="Когда появятся поставщики с оплатой позже, они будут видны здесь."
            />
          )}
        </CardContent>
      </Card>
    </section>
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
  const isScrollable = wallets.length > 8;
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
        {isScrollable ? (
          <ScrollArea className="max-h-[27rem]">
            <WalletRows
              wallets={wallets}
              myWallets={myWallets}
              debtCreatedAt={debtCreatedAt}
              operationType={operationType}
              tone={tone}
            />
          </ScrollArea>
        ) : (
          <WalletRows
            wallets={wallets}
            myWallets={myWallets}
            debtCreatedAt={debtCreatedAt}
            operationType={operationType}
            tone={tone}
          />
        )}
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
