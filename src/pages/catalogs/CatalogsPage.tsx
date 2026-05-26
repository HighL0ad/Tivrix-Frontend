import { useEffect, useRef, useState } from "react";
import { Banknote, Building2, CreditCard, Handshake, Landmark, Pencil, Search, Tags, Trash2, UserRound, X } from "lucide-react";
import { useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { useCurrentUser } from "@/entities/auth/api/use-current-user";
import {
  type ClientSource,
  useCatalogs,
  useCreateClientSource,
  useCreateWallet,
  useDeleteClientSource,
  useUpdateClientSource,
} from "@/entities/catalogs/api/use-catalogs";
import type { WalletType } from "@/entities/finance/api/use-finance";
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
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const catalogsQuery = useCatalogs();
  const createWallet = useCreateWallet();
  const createClientSource = useCreateClientSource();
  const currentUser = useCurrentUser().data;
  const [name, setName] = useState("");
  const [recordType, setRecordType] = useState<WalletType | "client_source">("card");
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [activeTab, setActiveTab] = useState(getCatalogTab(searchParams.get("tab")));
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSearch(searchParams.get("search") ?? "");
    setActiveTab(getCatalogTab(searchParams.get("tab")));
  }, [searchParams]);

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
  const canAdjustWallets = Boolean(
    currentUser?.operation_permissions.can_adjust_wallets,
  );

  return (
    <section className="space-y-5">
      <PageHeader
        title={t("catalogs.title")}
        description={t("catalogs.description")}
      />

      {canAdjustWallets ? (
      <Card>
        <CardHeader>
          <CardTitle>{t("catalogs.newRecord")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-2 sm:grid-cols-[1fr_220px_auto]"
            onSubmit={(event) => {
              event.preventDefault();
              const nextName = name.trim();
              if (!nextName) return;
              if (recordType === "client_source") {
                createClientSource.mutate(
                  { name: nextName },
                  {
                    onSuccess: () => {
                      setName("");
                      setActiveTab("advanced");
                      toast.success(t("catalogs.clientSourceCreated"));
                    },
                    onError: (error) => toast.error(getApiErrorMessage(error)),
                  },
                );
                return;
              }

              createWallet.mutate(
                { name: nextName, wallet_type: recordType },
                {
                  onSuccess: () => {
                    setName("");
                    toast.success(t("catalogs.created"));
                  },
                  onError: (error) => toast.error(getApiErrorMessage(error)),
                },
              );
            }}
          >
            <Input ref={nameInputRef} value={name} onChange={(event) => setName(event.target.value)} placeholder={t("common.name")} />
            <AppSelect
              value={recordType}
              onValueChange={(value) =>
                setRecordType(value as WalletType | "client_source")
              }
              options={[
                ...catalogsQuery.data.wallet_types.map((type) => ({
                  id: type.value,
                  name: walletTypeLabel(type.value),
                })),
                {
                  id: "client_source",
                  name: t("catalogs.clientSource"),
                },
              ]}
            />
            <Button type="submit">{t("common.create")}</Button>
          </form>
        </CardContent>
      </Card>
      ) : null}

      <Card>
        <CardHeader className="gap-3">
          <CardTitle>{t("catalogs.allRecords")}</CardTitle>
          <div className="grid gap-3">
            <div className="relative min-w-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
                placeholder={t("catalogs.searchByName")}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(getCatalogTab(value))}>
            <TabsList className="mb-4">
              <TabsTrigger value="wallets">{t("catalogs.wallets")}</TabsTrigger>
              <TabsTrigger value="clients">{t("catalogs.clients")}</TabsTrigger>
              <TabsTrigger value="suppliers">{t("catalogs.suppliers")}</TabsTrigger>
              <TabsTrigger value="advanced">{t("catalogs.advanced")}</TabsTrigger>
            </TabsList>
            <TabsContent value="wallets">
              <WalletTable
                tableLabel={t("catalogs.walletsTable")}
                tableIcon={<Banknote className="size-4" aria-hidden="true" />}
                wallets={groupedWallets.wallets}
                walletTypes={catalogsQuery.data.wallet_types}
                emptyTitle={t("catalogs.walletsEmptyTitle")}
                emptyDescription={t("catalogs.walletsEmptyDescription")}
                onCreateClick={() => nameInputRef.current?.focus()}
                canAdjustWallets={canAdjustWallets}
              />
            </TabsContent>
            <TabsContent value="clients">
              <WalletTable
                tableLabel={t("catalogs.clientsTable")}
                tableIcon={<UserRound className="size-4" aria-hidden="true" />}
                wallets={groupedWallets.clients}
                walletTypes={catalogsQuery.data.wallet_types}
                emptyTitle={t("catalogs.clientsEmptyTitle")}
                emptyDescription={t("catalogs.clientsEmptyDescription")}
                onCreateClick={() => nameInputRef.current?.focus()}
                canAdjustWallets={canAdjustWallets}
              />
            </TabsContent>
            <TabsContent value="suppliers">
              <WalletTable
                tableLabel={t("catalogs.suppliersTable")}
                tableIcon={<Handshake className="size-4" aria-hidden="true" />}
                wallets={groupedWallets.suppliers}
                walletTypes={catalogsQuery.data.wallet_types}
                emptyTitle={t("catalogs.suppliersEmptyTitle")}
                emptyDescription={t("catalogs.suppliersEmptyDescription")}
                onCreateClick={() => nameInputRef.current?.focus()}
                canAdjustWallets={canAdjustWallets}
              />
            </TabsContent>
            <TabsContent value="advanced">
              <AdvancedRecordsBlock
                sources={catalogsQuery.data.client_sources.filter((source) =>
                  source.name.toLowerCase().includes(search.toLowerCase().trim()),
                )}
                wallets={groupedWallets.advanced}
                walletTypes={catalogsQuery.data.wallet_types}
                canAdjustWallets={canAdjustWallets}
                onCreateClick={() => nameInputRef.current?.focus()}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </section>
  );
}

function AdvancedRecordsBlock({
  sources,
  wallets,
  walletTypes,
  canAdjustWallets,
  onCreateClick,
}: {
  sources: ClientSource[];
  wallets: NonNullable<ReturnType<typeof useCatalogs>["data"]>["wallets"];
  walletTypes: Array<{ value: WalletType; label: string }>;
  canAdjustWallets: boolean;
  onCreateClick: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          <Tags className="size-4" aria-hidden="true" />
          {t("catalogs.advancedTable")}
        </div>
      </div>
      <AdvancedRecordsTable
        sources={sources}
        wallets={wallets}
        walletTypes={walletTypes}
        canAdjustWallets={canAdjustWallets}
        onCreateClick={onCreateClick}
      />
    </div>
  );
}

function AdvancedRecordsTable({
  sources,
  wallets,
  walletTypes,
  canAdjustWallets,
  onCreateClick,
}: {
  sources: ClientSource[];
  wallets: NonNullable<ReturnType<typeof useCatalogs>["data"]>["wallets"];
  walletTypes: Array<{ value: WalletType; label: string }>;
  canAdjustWallets: boolean;
  onCreateClick: () => void;
}) {
  const { t } = useTranslation();
  const updateClientSource = useUpdateClientSource();
  const deleteClientSource = useDeleteClientSource();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");

  if (!sources.length && !wallets.length) {
    return (
      <EmptyState
        title={t("catalogs.advancedEmptyTitle")}
        description={t("catalogs.advancedEmptyDescription")}
        action={
          canAdjustWallets ? (
            <Button type="button" onClick={onCreateClick}>
              {t("catalogs.createRecord")}
            </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {/* Desktop view */}
      <div className="max-h-[70vh] overflow-auto rounded-xl border border-border bg-card shadow-sm hidden md:block">
        <Table className="[&_td]:h-[52px]" containerClassName="rounded-none border-0">
          <TableHeader className="sticky top-0 z-10 bg-muted/80 backdrop-blur">
            <TableRow>
              <TableHead>{t("common.name")}</TableHead>
              <TableHead>{t("common.type")}</TableHead>
              <TableHead className="text-right">{t("common.balance")}</TableHead>
              <TableHead className="w-28" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sources.map((source) => {
              const isEditing = editingId === source.id;
              return (
                <TableRow key={source.id}>
                  <TableCell className="font-semibold">
                    {isEditing ? (
                      <Input
                        value={editingName}
                        onChange={(event) => setEditingName(event.target.value)}
                        className="h-10"
                      />
                    ) : (
                      source.name
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-bold text-violet-700 ring-1 ring-violet-200">
                      <Tags className="size-3" aria-hidden="true" />
                      {t("catalogs.clientSource")}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">-</TableCell>
                  <TableCell>
                    {canAdjustWallets ? (
                      <div className="flex justify-end gap-1.5">
                        {isEditing ? (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => {
                                const nextName = editingName.trim();
                                if (!nextName) return;
                                updateClientSource.mutate(
                                  {
                                    sourceId: source.id,
                                    payload: { name: nextName },
                                  },
                                  {
                                    onSuccess: () => {
                                      setEditingId(null);
                                      toast.success(t("catalogs.updated"));
                                    },
                                    onError: (error) =>
                                      toast.error(getApiErrorMessage(error)),
                                  },
                                );
                              }}
                            >
                              {t("common.save")}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon-sm"
                              onClick={() => setEditingId(null)}
                              aria-label={t("common.cancel")}
                            >
                              <X className="size-4" aria-hidden="true" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon-sm"
                              onClick={() => {
                                setEditingId(source.id);
                                setEditingName(source.name);
                              }}
                              aria-label={t("common.edit")}
                            >
                              <Pencil className="size-4" aria-hidden="true" />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon-sm"
                              onClick={() => {
                                deleteClientSource.mutate(source.id, {
                                  onSuccess: () =>
                                    toast.warning(t("catalogs.deleted")),
                                  onError: (error) =>
                                    toast.error(getApiErrorMessage(error)),
                                });
                              }}
                              aria-label={t("common.delete")}
                            >
                              <Trash2 className="size-4" aria-hidden="true" />
                            </Button>
                          </>
                        )}
                      </div>
                    ) : null}
                  </TableCell>
                </TableRow>
              );
            })}
            {wallets.map((wallet) => (
              <TableRow key={`wallet-${wallet.id}`}>
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
                    {canAdjustWallets && !isSystemWallet(wallet.type) ? (
                      <>
                        <AdjustWalletDialog wallet={wallet} />
                        <WalletEditDialog wallet={wallet} walletTypes={walletTypes} />
                        <DeleteWalletButton walletId={wallet.id} walletName={wallet.name} />
                      </>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card List */}
      <div className="grid gap-3 md:hidden">
        {sources.map((source) => {
          const isEditing = editingId === source.id;
          return (
            <div key={source.id} className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground text-sm flex-1 mr-2">
                  {isEditing ? (
                    <Input
                      value={editingName}
                      onChange={(event) => setEditingName(event.target.value)}
                      className="h-11 text-base w-full"
                    />
                  ) : (
                    source.name
                  )}
                </span>
                <span className="text-right font-bold text-sm text-muted-foreground">-</span>
              </div>

              <div className="flex items-center justify-between border-t border-border/50 pt-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-bold text-violet-700 ring-1 ring-violet-200">
                  <Tags className="size-3" aria-hidden="true" />
                  {t("catalogs.clientSource")}
                </span>

                {canAdjustWallets ? (
                  <div className="flex items-center gap-1.5">
                    {isEditing ? (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            const nextName = editingName.trim();
                            if (!nextName) return;
                            updateClientSource.mutate(
                              {
                                sourceId: source.id,
                                payload: { name: nextName },
                              },
                              {
                                onSuccess: () => {
                                  setEditingId(null);
                                  toast.success(t("catalogs.updated"));
                                },
                                onError: (error) =>
                                  toast.error(getApiErrorMessage(error)),
                                },
                              );
                          }}
                        >
                          {t("common.save")}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          onClick={() => setEditingId(null)}
                          aria-label={t("common.cancel")}
                        >
                          <X className="size-4" aria-hidden="true" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          onClick={() => {
                            setEditingId(source.id);
                            setEditingName(source.name);
                          }}
                          aria-label={t("common.edit")}
                        >
                          <Pencil className="size-4" aria-hidden="true" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          onClick={() => {
                            deleteClientSource.mutate(source.id, {
                              onSuccess: () =>
                                toast.warning(t("catalogs.deleted")),
                              onError: (error) =>
                                toast.error(getApiErrorMessage(error)),
                            });
                          }}
                          aria-label={t("common.delete")}
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </Button>
                      </>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}

        {wallets.map((wallet) => (
          <div key={`wallet-${wallet.id}`} className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground text-sm">{wallet.name}</span>
              <span
                className={cn(
                  "font-bold text-sm",
                  Number(wallet.balance) === 0 ? "text-muted-foreground" : 
                  Number(wallet.balance) < 0 ? "text-rose-600" : "text-emerald-600"
                )}
              >
                {money(wallet.balance)}
              </span>
            </div>

            <div className="flex items-center justify-between border-t border-border/50 pt-2.5">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold",
                  walletTypeChipClass(wallet.type),
                )}
              >
                {walletTypeIcon(wallet.type)}
                {walletTypeLabel(wallet.type)}
              </span>

              {canAdjustWallets && !isSystemWallet(wallet.type) ? (
                <div className="flex items-center gap-1.5">
                  <AdjustWalletDialog wallet={wallet} />
                  <WalletEditDialog wallet={wallet} walletTypes={walletTypes} />
                  <DeleteWalletButton walletId={wallet.id} walletName={wallet.name} />
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getCatalogTab(value: string | null) {
  if (value === "clients" || value === "suppliers" || value === "advanced") {
    return value;
  }
  return "wallets";
}

function WalletTable({
  tableLabel,
  tableIcon,
  wallets,
  walletTypes,
  emptyTitle,
  emptyDescription,
  onCreateClick,
  canAdjustWallets,
}: {
  tableLabel: string;
  tableIcon: React.ReactNode;
  wallets: NonNullable<ReturnType<typeof useCatalogs>["data"]>["wallets"];
  walletTypes: Array<{ value: WalletType; label: string }>;
  emptyTitle: string;
  emptyDescription: string;
  onCreateClick: () => void;
  canAdjustWallets: boolean;
}) {
  const { t } = useTranslation();

  if (!wallets.length) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={
          canAdjustWallets ? (
          <Button type="button" onClick={onCreateClick}>
            {t("catalogs.createRecord")}
          </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
        {tableIcon}
        {tableLabel}
      </div>
      <div className="max-h-[70vh] overflow-auto rounded-xl border border-border bg-card shadow-sm hidden md:block">
        <Table className="[&_td]:h-[52px]" containerClassName="rounded-none border-0">
          <TableHeader className="sticky top-0 z-10 bg-muted/80 backdrop-blur">
            <TableRow>
              <TableHead>{t("common.name")}</TableHead>
              <TableHead>{t("common.type")}</TableHead>
              <TableHead className="text-right">{t("common.balance")}</TableHead>
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
                    {canAdjustWallets && !isSystemWallet(wallet.type) ? (
                      <>
                        <AdjustWalletDialog wallet={wallet} />
                        <WalletEditDialog wallet={wallet} walletTypes={walletTypes} />
                        <DeleteWalletButton walletId={wallet.id} walletName={wallet.name} />
                      </>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Wallet Card List */}
      <div className="grid gap-3 md:hidden">
        {wallets.map((wallet) => (
          <div key={wallet.id} className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground text-sm">{wallet.name}</span>
              <span
                className={cn(
                  "font-bold text-sm",
                  Number(wallet.balance) === 0 ? "text-muted-foreground" : 
                  Number(wallet.balance) < 0 ? "text-rose-600" : "text-emerald-600"
                )}
              >
                {money(wallet.balance)}
              </span>
            </div>

            <div className="flex items-center justify-between border-t border-border/50 pt-2.5">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold",
                  walletTypeChipClass(wallet.type),
                )}
              >
                {walletTypeIcon(wallet.type)}
                {walletTypeLabel(wallet.type)}
              </span>

              {canAdjustWallets && !isSystemWallet(wallet.type) ? (
                <div className="flex items-center gap-1.5">
                  <AdjustWalletDialog wallet={wallet} />
                  <WalletEditDialog wallet={wallet} walletTypes={walletTypes} />
                  <DeleteWalletButton walletId={wallet.id} walletName={wallet.name} />
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function walletTypeChipClass(type: string) {
  if (["cash", "card", "bank_account", "credit_cash"].includes(type)) {
    return "bg-sky-50 text-sky-700 ring-1 ring-sky-200";
  }
  if (type === "internal_credit_debt") {
    return "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200";
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
  if (type === "credit_cash") return <Banknote className={className} />;
  if (type === "internal_credit_debt") return <Landmark className={className} />;
  if (type === "bank_account") return <Landmark className={className} />;
  if (["card", "bank_card"].includes(type)) return <CreditCard className={className} />;
  if (type === "client_debt") return <UserRound className={className} />;
  if (["shop", "partner"].includes(type)) return <Handshake className={className} />;
  return <Building2 className={className} />;
}

function isSystemWallet(type: string) {
  return type === "credit_cash" || type === "internal_credit_debt";
}
