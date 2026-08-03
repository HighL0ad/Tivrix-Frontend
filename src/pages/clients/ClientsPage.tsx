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
import { EmptyState } from "@/shared/ui/empty-state";
import { Input } from "@/shared/ui/input";
import { HighlightText } from "@/shared/ui/highlight-text";
import { formatPhoneInput } from "@/shared/lib/input-formatters";
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
      card: "border-border before:from-gray-300 before:to-gray-500",
      activeCard: "border-border bg-muted/50 before:from-gray-400 before:to-gray-600 ring-2 ring-ring/10",
      icon: "border-border bg-muted text-foreground",
      activeIcon: "border-border bg-muted text-foreground",
    },
    good: {
      card: "border-emerald-200 before:from-emerald-400 before:to-teal-500",
      activeCard: "border-emerald-400 bg-emerald-50/30 dark:bg-emerald-500/10 before:from-emerald-400 before:to-teal-600 ring-2 ring-emerald-500/10",
      icon: "border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-400/45 dark:bg-emerald-400/16 dark:text-emerald-200",
      activeIcon: "border-emerald-300 bg-emerald-200/80 text-emerald-950 dark:border-emerald-300/60 dark:bg-emerald-400/24 dark:text-emerald-100",
    },
    bad: {
      card: "border-rose-200 before:from-rose-400 before:to-red-500",
      activeCard: "border-rose-400 bg-rose-50/30 dark:bg-rose-500/10 before:from-rose-400 before:to-red-600 ring-2 ring-rose-500/10",
      icon: "border-rose-200 bg-rose-100 text-rose-700 dark:border-rose-400/45 dark:bg-rose-400/16 dark:text-rose-200",
      activeIcon: "border-rose-300 bg-rose-200/80 text-rose-950 dark:border-rose-300/60 dark:bg-rose-400/24 dark:text-rose-100",
    },
    info: {
      card: "border-blue-200 before:from-blue-400 before:to-indigo-500",
      activeCard: "border-blue-400 bg-blue-50/30 dark:bg-sky-500/10 before:from-blue-400 before:to-indigo-600 ring-2 ring-blue-500/10",
      icon: "border-sky-200 bg-indigo-100 text-indigo-700 dark:border-sky-400/45 dark:bg-sky-400/16 dark:text-sky-200",
      activeIcon: "border-indigo-300 bg-indigo-200/80 text-indigo-950 dark:border-sky-300/60 dark:bg-sky-400/24 dark:text-sky-100",
    },
    warning: {
      card: "border-amber-200 before:from-amber-400 before:to-orange-500",
      activeCard: "border-amber-400 bg-amber-50/30 dark:bg-amber-500/10 before:from-amber-400 before:to-orange-600 ring-2 ring-amber-500/10",
      icon: "border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-400/45 dark:bg-amber-400/16 dark:text-amber-200",
      activeIcon: "border-amber-300 bg-amber-200/80 text-amber-950 dark:border-amber-300/60 dark:bg-amber-400/24 dark:text-amber-100",
    },
    violet: {
      card: "border-violet-200 before:from-violet-400 before:to-fuchsia-500",
      activeCard: "border-violet-400 bg-violet-50/30 dark:bg-violet-500/10 before:from-violet-400 before:to-fuchsia-600 ring-2 ring-violet-500/10",
      icon: "border-violet-200 bg-violet-100 text-violet-700 dark:border-violet-400/45 dark:bg-violet-400/16 dark:text-violet-200",
      activeIcon: "border-violet-300 bg-violet-200/80 text-violet-950 dark:border-violet-300/60 dark:bg-violet-400/24 dark:text-violet-100",
    },
  }[tone];

  return (
    <Card
      size="sm"
      className={cn(
        "relative cursor-pointer select-none transition-all duration-300 hover:scale-[1.015] active:scale-[0.985] before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-linear-to-r",
        active ? cn("shadow-md", toneStyle.activeCard) : cn("bg-card hover:bg-muted/40 hover:shadow-xs", toneStyle.card)
      )}
      onClick={onClick}
    >
      <CardContent className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground transition-colors">
            {title}
          </div>
          <div className="mt-2 break-words font-black tracking-tight text-foreground text-xl leading-none">
            {value}
          </div>
          {hint ? <div className="mt-1 text-xs text-muted-foreground">{hint}</div> : null}
        </div>
        {icon ? (
          <div className={cn("rounded-lg border p-2 shadow-sm transition-colors [&_svg]:stroke-[2.6]", active ? toneStyle.activeIcon : toneStyle.icon)}>
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
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
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
                          className="cursor-pointer transition-colors hover:bg-muted/60"
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
                              <span><HighlightText text={client.name} highlight={debouncedSearch} /></span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            <HighlightText text={client.phone} highlight={debouncedSearch} />
                          </TableCell>
                          <TableCell>
                            {hasDebt ? (
                              <Badge variant="outline" className="border-rose-200 bg-rose-50 font-bold text-rose-700 dark:border-rose-500/35 dark:bg-rose-500/10 dark:text-rose-300">
                                {money(client.total_debt)}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">{money(client.total_debt)}</span>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{client.purchases_count}</TableCell>
                          <TableCell className="text-muted-foreground">{shortDate(client.last_purchase_at)}</TableCell>
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
                          hasDebt ? "bg-card border-border" : "bg-card"
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
                            <span className="font-semibold text-foreground text-sm">
                              <HighlightText text={client.name} highlight={debouncedSearch} />
                            </span>
                          </div>
                          <div>
                            {hasDebt ? (
                              <Badge variant="outline" className="border-rose-200 bg-rose-50 font-bold text-rose-700 dark:border-rose-500/35 dark:bg-rose-500/10 dark:text-rose-300">
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
                              <HighlightText text={client.phone} highlight={debouncedSearch} />
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

import { AppFormField, AppModalActions, ResponsiveModal } from "@/shared/ui/app-form";

function ClientCreateDialog() {
  const { t } = useTranslation();
  const createClient = useCreateClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [backupPhone, setBackupPhone] = useState("");

  const handleSubmit = (event: React.FormEvent) => {
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
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={setOpen}
      title={t("clients.add")}
      trigger={
        <Button>
          <UserPlus className="size-4" />
          {t("clients.add")}
        </Button>
      }
      footer={
        <AppModalActions
          submitForm="client-create-form"
          submitLabel={t("common.save")}
          pendingLabel={t("common.saving")}
          pending={createClient.isPending}
          disabled={!name.trim()}
          onCancel={() => setOpen(false)}
          cancelLabel={t("common.cancel")}
        />
      }
    >
      <form id="client-create-form" className="space-y-4" onSubmit={handleSubmit}>
        <AppFormField label={t("common.name")} error={null}>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Əli Məmmədov"
            required
          />
        </AppFormField>
        <div className="grid gap-3 sm:grid-cols-2">
          <AppFormField label={t("products.phone")}>
            <Input
              value={phone}
              onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
              placeholder="+994 (50) 123-45-67"
            />
          </AppFormField>
          <AppFormField label={t("clients.backupPhone")}>
            <Input
              value={backupPhone}
              onChange={(e) => setBackupPhone(formatPhoneInput(e.target.value))}
              placeholder="+994 (70) 123-45-67"
            />
          </AppFormField>
        </div>
      </form>
    </ResponsiveModal>
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
    backgroundColor: `light-dark(hsl(${hue}, 70%, 92%), color-mix(in srgb, hsl(${hue}, 70%, 42%) 28%, var(--card)))`,
    color: `light-dark(hsl(${hue}, 65%, 35%), hsl(${hue}, 78%, 78%))`,
  };
}
