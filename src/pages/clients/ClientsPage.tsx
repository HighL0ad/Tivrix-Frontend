import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { AlertCircle, Search, UserPlus, Users, Wallet } from "lucide-react";
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import { useClients, useCreateClient } from "@/entities/clients/api/use-clients";
import { getApiErrorMessage } from "@/shared/api/error";
import { money, shortDate } from "@/shared/lib/format";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/ui/dialog";
import { EmptyState } from "@/shared/ui/empty-state";
import { Input } from "@/shared/ui/input";
import { PageHeader } from "@/shared/ui/page-header";
import { PageError, PageLoading } from "@/shared/ui/page-state";
import { PaginationBar } from "@/shared/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { cn } from "@/shared/lib/utils";

const CLIENTS_PAGE_LIMIT = 25;

function FilterCard({
  title,
  value,
  hint,
  active,
  tone = "neutral",
  icon,
  onClick,
}: {
  title: string;
  value: ReactNode;
  hint?: string;
  active: boolean;
  tone?: "neutral" | "good" | "bad" | "info" | "warning" | "violet";
  icon?: ReactNode;
  onClick: () => void;
}) {
  const toneStyle = {
    neutral: {
      card: "border-gray-200 before:from-gray-300 before:to-gray-500",
      activeCard: "border-gray-400 bg-gray-50/50 before:from-gray-400 before:to-gray-600 ring-2 ring-gray-400/10",
      icon: "text-gray-700 bg-gray-100",
      activeIcon: "text-gray-900 bg-gray-200/80 border-gray-300",
    },
    good: {
      card: "border-emerald-200 before:from-emerald-400 before:to-teal-500",
      activeCard: "border-emerald-400 bg-emerald-50/30 before:from-emerald-400 before:to-teal-600 ring-2 ring-emerald-500/10",
      icon: "text-emerald-700 bg-emerald-100",
      activeIcon: "text-emerald-950 bg-emerald-200/80 border-emerald-300",
    },
    bad: {
      card: "border-rose-200 before:from-rose-400 before:to-red-500",
      activeCard: "border-rose-400 bg-rose-50/30 before:from-rose-400 before:to-red-600 ring-2 ring-rose-500/10",
      icon: "text-rose-700 bg-rose-100",
      activeIcon: "text-rose-950 bg-rose-200/80 border-rose-300",
    },
    info: {
      card: "border-blue-200 before:from-blue-400 before:to-indigo-500",
      activeCard: "border-blue-400 bg-blue-50/30 before:from-blue-400 before:to-indigo-600 ring-2 ring-blue-500/10",
      icon: "text-indigo-700 bg-indigo-100",
      activeIcon: "text-indigo-950 bg-indigo-200/80 border-indigo-300",
    },
    warning: {
      card: "border-amber-200 before:from-amber-400 before:to-orange-500",
      activeCard: "border-amber-400 bg-amber-50/30 before:from-amber-400 before:to-orange-600 ring-2 ring-amber-500/10",
      icon: "text-amber-700 bg-amber-100",
      activeIcon: "text-amber-950 bg-amber-200/80 border-amber-300",
    },
    violet: {
      card: "border-violet-200 before:from-violet-400 before:to-fuchsia-500",
      activeCard: "border-violet-400 bg-violet-50/30 before:from-violet-400 before:to-fuchsia-600 ring-2 ring-violet-500/10",
      icon: "text-violet-700 bg-violet-100",
      activeIcon: "text-violet-950 bg-violet-200/80 border-violet-300",
    },
  }[tone];

  return (
    <Card
      size="sm"
      className={cn(
        "relative cursor-pointer select-none transition-all duration-300 hover:scale-[1.015] active:scale-[0.985] before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-linear-to-r",
        active ? cn("shadow-md", toneStyle.activeCard) : cn("bg-white hover:bg-gray-50/40 hover:shadow-xs", toneStyle.card)
      )}
      onClick={onClick}
    >
      <CardContent className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-bold uppercase tracking-wide text-gray-500 transition-colors">
            {title}
          </div>
          <div className="mt-2 break-words font-black tracking-tight text-gray-950 text-xl leading-none">
            {value}
          </div>
          {hint ? <div className="mt-1 text-xs text-gray-500">{hint}</div> : null}
        </div>
        {icon ? (
          <div className={cn("rounded-lg border border-white/80 p-2 shadow-sm transition-colors", active ? toneStyle.activeIcon : toneStyle.icon)}>
            {icon}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function ClientsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [{ page, filter }, setClientParams] = useQueryStates(
    {
      page: parseAsInteger.withDefault(1),
      filter: parseAsString.withDefault("debt"),
    },
    { scroll: false },
  );
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const previousDebouncedSearch = useRef(debouncedSearch);
  const clientsQuery = useClients({
    q: debouncedSearch.trim() || undefined,
    filter: filter || undefined,
    page,
    limit: CLIENTS_PAGE_LIMIT,
  });
  const clients = clientsQuery.data?.items ?? [];
  const totalPages = clientsQuery.data?.total_pages ?? 1;

  useEffect(() => {
    if (previousDebouncedSearch.current === debouncedSearch) return;
    previousDebouncedSearch.current = debouncedSearch;
    setClientParams({ page: 1 });
  }, [debouncedSearch, setClientParams]);

  if (clientsQuery.isPending && !clientsQuery.data) {
    return <PageLoading />;
  }

  if (!clientsQuery.data) {
    return <PageError />;
  }

  const counts = {
    total: clientsQuery.data.clients_total ?? 0,
    with_debt: clientsQuery.data.clients_with_debt ?? 0,
    overdue: clientsQuery.data.clients_overdue ?? 0,
  };

  return (
    <section className="space-y-5">
      <PageHeader
        title={t("clients.title")}
        description={t("clients.description")}
        actions={<ClientCreateDialog />}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <FilterCard
          title={t("clients.filter.installments")}
          value={String(counts.with_debt)}
          hint={t("clients.totalDebt") + ": " + money(clientsQuery.data.total_debt)}
          active={filter === "debt"}
          tone="violet"
          icon={<Wallet className="size-4" />}
          onClick={() => setClientParams({ filter: "debt", page: 1 })}
        />
        <FilterCard
          title={t("clients.filter.all")}
          value={String(counts.total)}
          hint={t("clients.totalPurchases") + ": " + clientsQuery.data.total_purchases_count}
          active={filter === "all"}
          tone="good"
          icon={<Users className="size-4" />}
          onClick={() => setClientParams({ filter: "all", page: 1 })}
        />
        <FilterCard
          title={t("clients.filter.overdue")}
          value={String(counts.overdue)}
          hint={t("clients.installmentStatus.overdue")}
          active={filter === "overdue"}
          tone="bad"
          icon={<AlertCircle className="size-4" />}
          onClick={() => setClientParams({ filter: "overdue", page: 1 })}
        />
      </div>

      <Card>
        <CardHeader className="gap-3">
          <CardTitle>{t("clients.list")}</CardTitle>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-9"
              placeholder={t("clients.search")}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className={clientsQuery.isFetching ? "opacity-60 transition-opacity duration-200" : "transition-opacity duration-200"}>
            {clients.length ? (
              <>
                <Table className="hidden md:table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("common.name")}</TableHead>
                      <TableHead>{t("products.phone")}</TableHead>
                      <TableHead>{t("clients.debt")}</TableHead>
                      <TableHead>{t("clients.purchases")}</TableHead>
                      <TableHead>{t("clients.lastPurchase")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clients.map((client) => {
                      const hasDebt = Number(client.total_debt) > 0;
                      return (
                        <TableRow
                          key={client.id}
                          className={hasDebt ? "cursor-pointer bg-rose-50/30 hover:bg-rose-50/60 transition-colors" : "cursor-pointer transition-colors hover:bg-gray-50/60"}
                          onClick={() =>
                            navigate(`/clients/${client.id}`, {
                              state: { from: `/clients?page=${page}` },
                            })
                          }
                        >
                          <TableCell className="font-semibold">
                            <div className="flex items-center gap-3">
                              <div
                                className="flex size-8 items-center justify-center rounded-full text-xs font-black uppercase select-none shrink-0"
                                style={getAvatarColorStyle(client.id)}
                              >
                                {getInitials(client.name)}
                              </div>
                              <span>{client.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-600">{client.phone ?? "—"}</TableCell>
                          <TableCell>
                            {hasDebt ? (
                              <Badge variant="outline" className="border-rose-200 bg-rose-50 font-bold text-rose-700">
                                {money(client.total_debt)}
                              </Badge>
                            ) : (
                              <span className="text-gray-400 text-sm">{money(client.total_debt)}</span>
                            )}
                          </TableCell>
                          <TableCell className="text-gray-600">{client.purchases_count}</TableCell>
                          <TableCell className="text-gray-500">{shortDate(client.last_purchase_at)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {/* Mobile Client Card List */}
                <div className="grid gap-3 md:hidden">
                  {clients.map((client) => {
                    const hasDebt = Number(client.total_debt) > 0;
                    return (
                      <div
                        key={client.id}
                        className={cn(
                          "rounded-xl border border-border p-4 shadow-sm space-y-3 cursor-pointer transition-all hover:scale-[1.01] active:scale-95",
                          hasDebt ? "bg-rose-50/20 border-rose-100" : "bg-card"
                        )}
                        onClick={() =>
                          navigate(`/clients/${client.id}`, {
                            state: { from: `/clients?page=${page}` },
                          })
                        }
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="flex size-8 items-center justify-center rounded-full text-xs font-black uppercase select-none shrink-0"
                              style={getAvatarColorStyle(client.id)}
                            >
                              {getInitials(client.name)}
                            </div>
                            <span className="font-semibold text-foreground text-sm">{client.name}</span>
                          </div>
                          <div>
                            {hasDebt ? (
                              <Badge variant="outline" className="border-rose-200 bg-rose-50 font-bold text-rose-700">
                                {money(client.total_debt)}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-xs font-medium">{money(client.total_debt)}</span>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 border-t border-border/50 pt-2.5 text-xs">
                          <div>
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                              {t("products.phone")}
                            </span>
                            <span className="font-medium text-foreground truncate block">
                              {client.phone ?? "—"}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                              {t("clients.purchases")}
                            </span>
                            <span className="font-medium text-foreground">
                              {client.purchases_count}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                              {t("clients.lastPurchase")}
                            </span>
                            <span className="font-medium text-foreground">
                              {client.last_purchase_at ? shortDate(client.last_purchase_at) : "—"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <EmptyState title={t("clients.emptyTitle")} description={t("clients.emptyDescription")} />
            )}
            {clients.length ? (
              <PaginationBar
                page={page}
                totalPages={totalPages}
                total={clientsQuery.data?.total ?? 0}
                onPageChange={(nextPage) => setClientParams({ page: nextPage })}
              />
            ) : null}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function useDebouncedValue(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timeout);
  }, [delay, value]);
  return debouncedValue;
}

function ClientCreateDialog() {
  const { t } = useTranslation();
  const createClient = useCreateClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [backupPhone, setBackupPhone] = useState("");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="size-4" />
          {t("clients.add")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{t("clients.add")}</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4 pt-2"
          onSubmit={(event) => {
            event.preventDefault();
            createClient.mutate(
              {
                name,
                phone: phone || undefined,
                backup_phone: backupPhone || undefined,
              },
              {
                onSuccess: () => {
                  setName("");
                  setPhone("");
                  setBackupPhone("");
                  setOpen(false);
                  toast.success(t("clients.created"));
                },
                onError: (error) => toast.error(getApiErrorMessage(error)),
              },
            );
          }}
        >
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {t("common.name")} <span className="text-rose-500">*</span>
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Əli Məmmədov"
                required
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {t("products.phone")}
                </label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+994 (50) 123-45-67"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {t("clients.backupPhone")}
                </label>
                <Input
                  value={backupPhone}
                  onChange={(e) => setBackupPhone(e.target.value)}
                  placeholder="+994 (70) 123-45-67"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={createClient.isPending}>
              {createClient.isPending ? t("common.saving") : t("common.save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.trim().slice(0, 2).toUpperCase() || "?";
}

function getAvatarColorStyle(id: number) {
  const hue = (id * 137) % 360;
  return {
    backgroundColor: `hsl(${hue}, 70%, 92%)`,
    color: `hsl(${hue}, 65%, 35%)`,
  };
}
