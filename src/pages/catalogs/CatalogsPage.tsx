import { useRef, useState } from "react";
import { Banknote, Building2, CreditCard, Handshake, Landmark, Search, UserRound } from "lucide-react";
import { toast } from "sonner";

import { useCatalogs, useCreateWallet } from "@/entities/catalogs/api/use-catalogs";
import { DeleteWalletButton } from "@/features/catalogs/DeleteWalletButton";
import { WalletEditDialog } from "@/features/catalogs/WalletEditDialog";
import { AdjustWalletDialog } from "@/features/finance/AdjustWalletDialog";
import { getApiErrorMessage } from "@/shared/api/error";
import { money } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";
import { walletTypeLabel } from "@/shared/lib/wallet-labels";
import { AppSelect } from "@/shared/ui/app-form";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { EmptyState } from "@/shared/ui/empty-state";
import { Input } from "@/shared/ui/input";
import { PageHeader } from "@/shared/ui/page-header";
import { PageError, PageLoading } from "@/shared/ui/page-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

const walletGroups = {
  wallets: ["cash", "card", "bank_account"],
  clients: ["client_debt"],
  suppliers: ["debt", "debt_supplier", "shop", "partner", "supplier"],
};

export function CatalogsPage() {
  const catalogsQuery = useCatalogs();
  const createWallet = useCreateWallet();
  const [name, setName] = useState("");
  const [walletType, setWalletType] = useState("card");
  const [search, setSearch] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);

  if (catalogsQuery.isLoading) {
    return <PageLoading />;
  }

  if (!catalogsQuery.data) {
    return <PageError />;
  }

  const filteredWallets = catalogsQuery.data.wallets.filter((wallet) => {
    const matchesSearch = wallet.name.toLowerCase().includes(search.toLowerCase().trim());
    return matchesSearch;
  });
  const groupedWallets = {
    wallets: filteredWallets.filter((wallet) => walletGroups.wallets.includes(wallet.type)),
    clients: filteredWallets.filter((wallet) => walletGroups.clients.includes(wallet.type)),
    suppliers: filteredWallets.filter((wallet) => walletGroups.suppliers.includes(wallet.type)),
    advanced: filteredWallets.filter(
      (wallet) =>
        ![...walletGroups.wallets, ...walletGroups.clients, ...walletGroups.suppliers].includes(wallet.type),
    ),
  };

  return (
    <section className="space-y-5">
      <PageHeader
        title="Справочники"
        description="Кошельки, поставщики, клиенты и партнёры."
      />

      <Card>
        <CardHeader>
          <CardTitle>Новая запись</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-2 sm:grid-cols-[1fr_220px_auto]"
            onSubmit={(event) => {
              event.preventDefault();
              if (!name.trim()) return;
              createWallet.mutate(
                { name: name.trim(), wallet_type: walletType },
                {
                  onSuccess: () => {
                    setName("");
                    toast.success("Запись создана");
                  },
                  onError: (error) => toast.error(getApiErrorMessage(error)),
                },
              );
            }}
          >
            <Input ref={nameInputRef} value={name} onChange={(event) => setName(event.target.value)} placeholder="Название" />
            <AppSelect
              value={walletType}
              onValueChange={setWalletType}
              options={catalogsQuery.data.wallet_types.map((type) => ({
                id: type.value,
                name: type.label === type.value ? walletTypeLabel(type.value) : type.label,
              }))}
            />
            <Button type="submit">Создать</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="gap-3">
          <CardTitle>Все записи</CardTitle>
          <div className="grid gap-3">
            <div className="relative min-w-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
                placeholder="Поиск по названию"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="wallets">
            <TabsList className="mb-4">
              <TabsTrigger value="wallets">Кошельки</TabsTrigger>
              <TabsTrigger value="clients">Клиенты</TabsTrigger>
              <TabsTrigger value="suppliers">Поставщики</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>
            <TabsContent value="wallets">
              <WalletTable
                tableLabel="Таблица кошельков"
                wallets={groupedWallets.wallets}
                walletTypes={catalogsQuery.data.wallet_types}
                emptyTitle="Кошельки ещё не добавлены"
                emptyDescription="Создайте первый кошелёк, чтобы учитывать кассу, карты и счета."
                onCreateClick={() => nameInputRef.current?.focus()}
              />
            </TabsContent>
            <TabsContent value="clients">
              <WalletTable
                tableLabel="Таблица клиентов"
                wallets={groupedWallets.clients}
                walletTypes={catalogsQuery.data.wallet_types}
                emptyTitle="Клиенты ещё не добавлены"
                emptyDescription="Добавьте первого клиента, чтобы потом быстро выбирать его в продаже и долгах."
                onCreateClick={() => nameInputRef.current?.focus()}
              />
            </TabsContent>
            <TabsContent value="suppliers">
              <WalletTable
                tableLabel="Таблица поставщиков"
                wallets={groupedWallets.suppliers}
                walletTypes={catalogsQuery.data.wallet_types}
                emptyTitle="Поставщики ещё не добавлены"
                emptyDescription="Добавьте первого поставщика или партнёра, чтобы привязывать закупки к каталогу."
                onCreateClick={() => nameInputRef.current?.focus()}
              />
            </TabsContent>
            <TabsContent value="advanced">
              <WalletTable
                tableLabel="Техническая таблица"
                wallets={groupedWallets.advanced}
                walletTypes={catalogsQuery.data.wallet_types}
                emptyTitle="Технических записей нет"
                emptyDescription="Когда появятся специальные типы кошельков, они будут показаны здесь."
                onCreateClick={() => nameInputRef.current?.focus()}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </section>
  );
}

function WalletTable({
  tableLabel,
  wallets,
  walletTypes,
  emptyTitle,
  emptyDescription,
  onCreateClick,
}: {
  tableLabel: string;
  wallets: NonNullable<ReturnType<typeof useCatalogs>["data"]>["wallets"];
  walletTypes: Array<{ value: string; label: string }>;
  emptyTitle: string;
  emptyDescription: string;
  onCreateClick: () => void;
}) {
  if (!wallets.length) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={
          <Button type="button" onClick={onCreateClick}>
            Создать запись
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
        {tableLabel}
      </div>
      <div className="max-h-[70vh] overflow-auto rounded-xl border border-border bg-card shadow-sm">
      <Table className="[&_td]:h-[52px]" containerClassName="rounded-none border-0">
        <TableHeader className="sticky top-0 z-10 bg-muted/80 backdrop-blur">
          <TableRow>
            <TableHead>Название</TableHead>
            <TableHead>Тип</TableHead>
            <TableHead className="text-right">Баланс</TableHead>
            <TableHead className="w-24" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {wallets.map((wallet) => (
            <TableRow key={wallet.id}>
              <TableCell className="font-semibold">{wallet.name}</TableCell>
              <TableCell>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold",
                    walletTypeChipClass(wallet.type),
                  )}
                >
                  {walletTypeIcon(wallet.type)}
                  {walletTypeLabel(wallet.type)}
                </span>
              </TableCell>
              <TableCell
                className={cn(
                  "text-right font-bold",
                  Number(wallet.balance) === 0 && "text-muted-foreground",
                )}
              >
                {money(wallet.balance)}
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1.5">
                  <AdjustWalletDialog wallet={wallet} />
                  <WalletEditDialog wallet={wallet} walletTypes={walletTypes} />
                  <DeleteWalletButton walletId={wallet.id} walletName={wallet.name} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>
    </div>
  );
}

function walletTypeChipClass(type: string) {
  if (["cash", "card", "bank_account"].includes(type)) {
    return "bg-sky-50 text-sky-700 ring-1 ring-sky-200";
  }
  if (type === "client_debt") {
    return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
  }
  if (["debt", "debt_supplier", "supplier"].includes(type)) {
    return "bg-rose-50 text-rose-700 ring-1 ring-rose-200";
  }
  if (["shop", "partner"].includes(type)) {
    return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
  }
  return "bg-gray-100 text-gray-700 ring-1 ring-gray-200";
}

function walletTypeIcon(type: string) {
  const className = "size-3";
  if (type === "cash") return <Banknote className={className} />;
  if (type === "bank_account") return <Landmark className={className} />;
  if (["card", "bank_card"].includes(type)) return <CreditCard className={className} />;
  if (type === "client_debt") return <UserRound className={className} />;
  if (["shop", "partner"].includes(type)) return <Handshake className={className} />;
  return <Building2 className={className} />;
}
