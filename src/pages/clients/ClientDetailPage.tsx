import { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation, useParams } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeftRight,
  Calendar,
  CalendarPlus,
  Copy,
  Edit,
  ShoppingBag,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import {
  useClient,
  useImportLegacyInstallment,
  useUpdateClient,
} from "@/entities/clients/api/use-clients";
import { useCatalogs } from "@/entities/catalogs/api/use-catalogs";
import { useRepayDebt } from "@/entities/debts/api/use-debts";
import { getApiErrorMessage } from "@/shared/api/error";
import { money, shortDate } from "@/shared/lib/format";
import { AppSelect, AppFormField, AppModalActions, ResponsiveModal } from "@/shared/ui/app-form";
import { BackButton } from "@/shared/ui/back-button";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { DatePicker } from "@/shared/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { EmptyState } from "@/shared/ui/empty-state";
import { Input } from "@/shared/ui/input";
import { formatPhoneInput } from "@/shared/lib/input-formatters";
import { PageHeader } from "@/shared/ui/page-header";
import { PageError, PageLoading } from "@/shared/ui/page-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { cn } from "@/shared/lib/utils";
import { ScrollArea } from "@/shared/ui/scroll-area";

export function ClientDetailPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const params = useParams();
  const clientId = Number(params.clientId);
  const clientQuery = useClient(Number.isFinite(clientId) ? clientId : null);
  const client = clientQuery.data;
  const returnTo =
    typeof location.state === "object" &&
    location.state &&
    "from" in location.state &&
    typeof location.state.from === "string"
      ? location.state.from
      : "/clients";
  const currentPath = `${location.pathname}${location.search}`;

  const [repayInstallment, setRepayInstallment] = useState<{
    open: boolean;
    installmentId?: number;
    applyInstallments?: boolean;
    amount?: string;
    productName?: string;
  }>({ open: false });

  const [timelineFilter, setTimelineFilter] = useState<"active" | "all" | "paid">("active");

  const filteredInstallments = useMemo(() => {
    if (!client?.installments) return [];
    if (timelineFilter === "active") {
      return client.installments.filter((ins) => ins.status !== "paid");
    }
    if (timelineFilter === "paid") {
      return client.installments.filter((ins) => ins.status === "paid");
    }
    return client.installments;
  }, [client?.installments, timelineFilter]);

  if (clientQuery.isLoading) return <PageLoading />;
  if (!client) return <PageError />;

  const totalPurchasesNum = Number(client.total_purchases);
  const totalDebtNum = Number(client.total_debt);
  const ordinaryDebtNum = Number(client.ordinary_debt);
  const totalPaid = Math.max(0, totalPurchasesNum - totalDebtNum);
  const paidPercent =
    totalPurchasesNum > 0
      ? Math.round((totalPaid / totalPurchasesNum) * 100)
      : 100;
  const hasDebt = totalDebtNum > 0;

  return (
    <section className="min-w-0 space-y-5 overflow-x-hidden">
      <PageHeader
        title={client.name}
        description={client.phone ?? client.backup_phone ?? t("clients.profile")}
        backButton={<BackButton to={returnTo} />}
        actions={
          <div className="flex flex-col w-full gap-2 sm:flex-row sm:w-auto sm:items-center">
            {hasDebt && (
              <Button
                variant="outline"
                className="w-full justify-center whitespace-normal text-center leading-tight sm:w-auto sm:whitespace-nowrap"
                onClick={() =>
                  setRepayInstallment({
                    open: true,
                    applyInstallments: true,
                    amount: client.total_debt,
                    productName: t("clients.totalDebt"),
                  })
                }
              >
                <Wallet className="size-4" />
                {t("debts.pay")}
              </Button>
            )}
            <LegacyInstallmentDialog clientId={client.id} />
            <ClientEditDialog client={client} />
          </div>
        }
      />

      <div className="grid min-w-0 gap-5 lg:grid-cols-[300px_1fr]">
        {/* ── Sidebar ── */}
        <div className="order-first min-w-0 space-y-3">
          {/* Avatar + stats + debt summary */}
          <Card size="sm" className={hasDebt ? "card-accent-rose" : "card-accent-emerald"}>
            <CardContent className="flex flex-col items-center gap-4 pt-5 text-center">
              {/* Avatar */}
              <div
                className="flex size-14 items-center justify-center rounded-full text-lg font-black uppercase select-none"
                style={getAvatarColorStyle(client.id)}
              >
                {getInitials(client.name)}
              </div>

              <div className="w-full">
                <div className="text-base font-bold text-gray-900">
                  {client.name}
                </div>
                {client.description && (
                  <p className="mt-1 text-xs leading-relaxed text-gray-500">
                    {client.description}
                  </p>
                )}
              </div>

              {/* Quick stats */}
              <div className="grid w-full grid-cols-2 divide-x rounded-lg border bg-gray-50 text-center text-xs">
                <div className="py-2.5 px-3">
                  <div className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                    {t("clients.purchases")}
                  </div>
                  <div className="mt-0.5 text-sm font-black text-gray-800">
                    {client.purchases_count}
                  </div>
                </div>
                <div className="py-2.5 px-3">
                  <div className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                    {t("clients.totalAmount")}
                  </div>
                  <div className="mt-0.5 text-sm font-black text-gray-800">
                    {money(client.total_purchases)}
                  </div>
                </div>
              </div>

              {/* Debt + progress bar */}
              <div className="w-full rounded-lg border bg-gray-50 px-3 py-3 text-left space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                    {t("clients.totalDebt")}
                  </span>
                  <span
                    className={cn(
                      "text-sm font-black",
                      hasDebt ? "text-rose-600" : "text-emerald-600",
                    )}
                  >
                    {money(client.total_debt)}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      paidPercent >= 100 ? "bg-emerald-500" : "bg-amber-400",
                    )}
                    style={{
                      width: `${Math.max(0, Math.min(100, paidPercent))}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-gray-400">
                  <span>{money(totalPaid)} {t("clients.paid").toLowerCase()}</span>
                  <span>{paidPercent}%</span>
                </div>
              </div>
              {ordinaryDebtNum > 0 ? (
                <div className="w-full rounded-lg border border-amber-200 bg-amber-50/50 card-accent-amber px-3 py-2.5 text-left">
                  <div className="text-[10px] font-bold uppercase tracking-wide text-amber-700">
                    {t("clients.ordinaryDebtNotice")}
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-3">
                    <span className="text-xs font-medium text-amber-800">
                      {t("clients.inDebtsSection")}
                    </span>
                    <span className="shrink-0 text-sm font-black text-amber-900">
                      {money(client.ordinary_debt)}
                    </span>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Contacts */}
          {(client.phone || client.backup_phone) && (
            <Card size="sm">
              <CardHeader>
                <CardTitle>{t("clients.contacts")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { label: t("products.phone"), value: client.phone },
                  { label: t("clients.backupPhone"), value: client.backup_phone },
                ].filter((item): item is { label: string; value: string } => Boolean(item.value)).map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-2 rounded-lg border bg-gray-50 px-3 py-2">
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                        {item.label}
                      </div>
                      <a
                        href={`tel:${item.value}`}
                        className="mt-0.5 block truncate text-sm font-semibold text-sky-600 hover:underline"
                      >
                        {item.value}
                      </a>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7 shrink-0 text-gray-400 hover:text-gray-700"
                      onClick={() => {
                        navigator.clipboard.writeText(item.value || "");
                        toast.info(t("common.copied"));
                      }}
                    >
                      <Copy className="size-3.5" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

        </div>

        {/* ── Main content ── */}
        <div className="order-last min-w-0 space-y-4">
          {/* Installment timeline */}
          <Card>
            <CardHeader className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="size-4 text-gray-400" />
                {t("clients.installments")}
              </CardTitle>

              {/* Filter tabs */}
              <div className="max-w-full overflow-x-auto sm:w-auto">
                <Tabs
                  value={timelineFilter}
                  onValueChange={(value) => setTimelineFilter(value as "active" | "all" | "paid")}
                  className="min-w-max gap-0 sm:min-w-0"
                >
                  <TabsList>
                  <TabsTrigger value="active">
                    {t("common.active")}
                  </TabsTrigger>
                  <TabsTrigger value="paid">
                    {t("clients.installmentStatus.paid")}
                  </TabsTrigger>
                  <TabsTrigger value="all">
                    {t("common.all")}
                  </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent className="pt-1">
              {filteredInstallments.length ? (
                <ol className="relative ml-1 space-y-3 pl-5 sm:ml-3 sm:pl-7">
                  {filteredInstallments.map((installment, index) => {
                    const isPaid = installment.status === "paid";
                    const isOverdue = installment.status === "overdue";
                    const remaining = Math.max(
                      0,
                      Number(installment.amount) -
                        Number(installment.paid_amount),
                    );

                    return (
                      <li
                        key={installment.id}
                        className={cn(
                          "relative flex flex-col gap-3 rounded-lg border p-3 transition-shadow hover:shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-4",
                          isOverdue
                            ? "border-rose-200 bg-rose-50/30"
                            : "border-border bg-card",
                        )}
                      >
                        {/* Vertical line segment to the next item */}
                        {index < filteredInstallments.length - 1 && (
                          <div className="absolute bottom-[-36px] left-[-21px] top-[24px] z-0 w-0.5 border-l-2 border-dashed border-gray-200 sm:left-[-29px]" />
                        )}

                        {/* Timeline dot */}
                        <span
                          className={cn(
                            "absolute left-[-20px] top-[24px] z-10 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-white sm:left-[-28px]",
                            isPaid
                              ? "border-emerald-500 bg-emerald-500"
                              : isOverdue
                                ? "border-rose-500 bg-rose-50"
                                : "border-amber-400 bg-amber-50",
                          )}
                        />

                        {/* Left: amount + status + due date */}
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-gray-900">
                              {money(installment.amount)}
                            </span>
                            <Badge
                              variant="outline"
                              className={getInstallmentBadgeClass(
                                installment.status,
                              )}
                            >
                              {t(
                                `clients.installmentStatus.${installment.status}`,
                              )}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
                            <span>{t("debts.dueDate")}:</span>
                            <span
                              className={cn(
                                "font-semibold",
                                isOverdue
                                  ? "text-rose-600"
                                  : "text-gray-700",
                              )}
                            >
                              {shortDate(installment.due_date)}
                            </span>
                            {installment.product_id &&
                              installment.product_name && (
                                <>
                                  <span className="text-gray-300">·</span>
                                  <NavLink
                                    className="font-semibold text-sky-600 hover:underline"
                                    to={`/products/${installment.product_id}`}
                                    state={{ from: currentPath }}
                                  >
                                    {installment.product_name}
                                  </NavLink>
                                </>
                              )}
                          </div>
                        </div>

                        {/* Right: paid amount + repay button */}
                        <div className="flex shrink-0 flex-col gap-3 border-t pt-3 sm:flex-row sm:items-center sm:border-0 sm:pt-0">
                          {Number(installment.paid_amount) > 0 && (
                            <div className="text-left sm:text-right">
                              <div className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                                {t("clients.paid")}
                              </div>
                              <div className="text-xs font-semibold text-gray-700">
                                {money(installment.paid_amount)} /{" "}
                                {money(installment.amount)}
                              </div>
                            </div>
                          )}
                          {!isPaid && (
                            <Button
                              type="button"
                              size="sm"
                              className="w-full sm:w-auto"
                              onClick={() =>
                                setRepayInstallment({
                                  open: true,
                                  installmentId: installment.id,
                                  amount: String(remaining),
                                  productName:
                                    installment.product_name ??
                                    t("clients.installments"),
                                })
                              }
                            >
                              {t("debts.pay")}
                            </Button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <EmptyState
                  title={t("clients.noInstallments")}
                  description={t("clients.noInstallmentsDescription")}
                />
              )}
            </CardContent>
          </Card>

          {/* Payment history */}
          <Card className="overflow-hidden gap-0 pb-0">
            <CardHeader className="border-b pb-4">
              <CardTitle className="flex items-center gap-2">
                <ArrowLeftRight className="size-4 text-gray-400" />
                {t("clients.payments")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {client.payments.length ? (
                <>
                <div className="grid gap-2 p-3 md:hidden">
                  {client.payments.map((payment) => (
                    <PaymentCard
                      key={payment.id}
                      payment={payment}
                      currentPath={currentPath}
                    />
                  ))}
                </div>
                <ScrollArea className="hidden max-h-72 md:block">
                  <Table containerClassName="border-0 rounded-none">
                    <TableHeader className="sticky top-0 z-10 bg-background shadow-sm">
                      <TableRow>
                        <TableHead className="w-[140px] min-w-[140px]">{t("finance.date")}</TableHead>
                        <TableHead className="w-[120px] min-w-[120px]">{t("common.type")}</TableHead>
                        <TableHead className="w-[320px] min-w-[320px]">{t("common.details")}</TableHead>
                        <TableHead className="w-[120px] min-w-[120px] text-left">
                          {t("finance.amount")}
                        </TableHead>
                        <TableHead className="w-[140px] min-w-[140px]">{t("debts.wallet")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {client.payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="whitespace-nowrap text-gray-500 align-top w-[140px] min-w-[140px]">
                            {shortDate(payment.created_at)}
                          </TableCell>
                          <TableCell className="align-top w-[120px] min-w-[120px]">
                            <Badge
                              variant="outline"
                              className={cn(
                                "mt-[1px]",
                                payment.direction === "payment"
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                  : payment.direction === "debt"
                                    ? "border-rose-200 bg-rose-50 text-rose-700"
                                    : "border-gray-200 bg-gray-50 text-gray-600"
                              )}
                            >
                              {t(
                                `clients.paymentDirection.${payment.direction}`,
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-gray-600 align-top w-[320px] min-w-[320px] max-w-[320px]">
                            <div className="flex flex-col gap-0.5 min-w-0">
                              <span className="truncate block" title={payment.description}>
                                {payment.description}
                              </span>
                              {payment.product_id && payment.product_name && (
                                <NavLink
                                  className="font-semibold text-sky-600 hover:underline truncate block"
                                  to={`/products/${payment.product_id}`}
                                  state={{ from: currentPath }}
                                  title={payment.product_name}
                                >
                                  {payment.product_name}
                                </NavLink>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-bold whitespace-nowrap align-top w-[120px] min-w-[120px] text-left">
                            {money(payment.amount)}
                          </TableCell>
                          <TableCell className="text-xs text-gray-500 align-top w-[140px] min-w-[140px]">
                            {[
                              payment.wallet_name,
                              payment.counterparty_wallet_name,
                            ]
                              .filter(Boolean)
                              .join(" → ") || "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
                </>
              ) : (
                <div className="p-5">
                  <EmptyState
                    title={t("clients.noPayments")}
                    description={t("clients.noPaymentsDescription")}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Purchase history */}
          <Card className="overflow-hidden gap-0 pb-0">
            <CardHeader className="border-b pb-4">
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="size-4 text-gray-400" />
                {t("clients.purchaseHistory")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {client.sales.length ? (
                <>
                <div className="grid gap-2 p-3 md:hidden">
                  {client.sales.map((sale) => (
                    <SaleCard
                      key={sale.id}
                      sale={sale}
                      currentPath={currentPath}
                    />
                  ))}
                </div>
                <ScrollArea className="hidden max-h-64 md:block">
                  <Table containerClassName="border-0 rounded-none">
                    <TableHeader className="sticky top-0 z-10 bg-background shadow-sm">
                      <TableRow>
                        <TableHead className="w-[140px] min-w-[140px]">{t("finance.date")}</TableHead>
                        <TableHead className="w-[280px] min-w-[280px]">{t("sell.product")}</TableHead>
                        <TableHead className="w-[200px] min-w-[200px]">IMEI</TableHead>
                        <TableHead className="text-left">
                          {t("finance.amount")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {client.sales.map((sale) => (
                        <TableRow key={sale.id}>
                          <TableCell className="whitespace-nowrap text-gray-500 align-top w-[140px] min-w-[140px]">
                            {shortDate(sale.sold_at)}
                          </TableCell>
                          <TableCell className="align-top w-[280px] min-w-[280px] max-w-[280px]">
                            <NavLink
                              className="text-xs font-semibold text-sky-600 hover:underline truncate block"
                              to={`/products/${sale.product_id}`}
                              state={{ from: currentPath }}
                            >
                              {sale.product_name}
                            </NavLink>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-gray-500 align-top w-[200px] min-w-[200px]">
                            {sale.product_imei}
                          </TableCell>
                          <TableCell className="font-bold whitespace-nowrap align-top text-left">
                            {money(sale.total_price)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
                </>
              ) : (
                <div className="p-5">
                  <EmptyState
                    title={t("clients.noPurchases")}
                    description={t("clients.noPurchasesDescription")}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <RepayDialog
        client={client}
        installmentId={repayInstallment.installmentId}
        applyInstallments={repayInstallment.applyInstallments}
        defaultAmount={repayInstallment.amount}
        productName={repayInstallment.productName}
        open={repayInstallment.open}
        onOpenChange={(open) =>
          setRepayInstallment((prev) => ({ ...prev, open }))
        }
      />
    </section>
  );
}

function LegacyInstallmentDialog({ clientId }: { clientId: number }) {
  const { t } = useTranslation();
  const importInstallment = useImportLegacyInstallment(clientId);
  const [open, setOpen] = useState(false);
  const [productName, setProductName] = useState("");
  const [cashPrice, setCashPrice] = useState("");
  const [creditPrice, setCreditPrice] = useState("");
  const [alreadyPaid, setAlreadyPaid] = useState("");
  const [remainingMonths, setRemainingMonths] = useState("");
  const [nextDueDate, setNextDueDate] = useState("");

  const reset = () => {
    setProductName("");
    setCashPrice("");
    setCreditPrice("");
    setAlreadyPaid("");
    setRemainingMonths("");
    setNextDueDate("");
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={setOpen}
      title={t("clients.importInstallment")}
      description={t("clients.importInstallmentDescription")}
      trigger={
        <Button
          variant="outline"
          className="w-full justify-center whitespace-normal text-center leading-tight sm:w-auto sm:whitespace-nowrap"
        >
          <CalendarPlus className="size-4" />
          {t("clients.importInstallment")}
        </Button>
      }
      footer={
        <AppModalActions
          submitForm="import-installment-form"
          submitLabel={t("common.save")}
          pendingLabel={t("common.saving")}
          pending={importInstallment.isPending}
          onCancel={() => setOpen(false)}
          cancelLabel={t("common.cancel")}
        />
      }
    >
      <form
        id="import-installment-form"
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!nextDueDate) {
            toast.error(t("clients.nextPaymentDate"));
            return;
          }
          importInstallment.mutate(
            {
              product_name: productName.trim(),
              cash_price: cashPrice,
              credit_price: creditPrice,
              already_paid: alreadyPaid || "0",
              remaining_months: Number(remainingMonths),
              next_due_date: nextDueDate,
            },
            {
              onSuccess: () => {
                toast.success(t("clients.installmentImported"));
                reset();
                setOpen(false);
              },
              onError: (error) => toast.error(getApiErrorMessage(error)),
            },
          );
        }}
      >
        <AppFormField label={t("sell.product")}>
          <Input
            value={productName}
            onChange={(event) => setProductName(event.target.value)}
            placeholder="iPhone 15 Pro 256GB"
            required
          />
        </AppFormField>
        <div className="grid gap-3 sm:grid-cols-2">
          <NumberField
            label={t("sell.baseSalePrice")}
            value={cashPrice}
            onChange={setCashPrice}
          />
          <NumberField
            label={t("sell.installmentTotalPrice")}
            value={creditPrice}
            onChange={setCreditPrice}
          />
          <NumberField
            label={t("clients.alreadyPaid")}
            value={alreadyPaid}
            onChange={setAlreadyPaid}
          />
          <NumberField
            label={t("clients.remainingMonths")}
            value={remainingMonths}
            onChange={setRemainingMonths}
            step="1"
          />
        </div>
        <AppFormField label={t("clients.nextPaymentDate")}>
          <DatePicker
            value={nextDueDate}
            onChange={setNextDueDate}
            placeholder={t("clients.nextPaymentDate")}
            className="w-full"
          />
        </AppFormField>
      </form>
    </ResponsiveModal>
  );
}

function NumberField({
  label,
  value,
  onChange,
  step = "0.01",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  step?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex h-8 items-end text-xs font-semibold uppercase tracking-wide text-gray-500 pb-0.5">
        {label}
      </label>
      <Input
        type="number"
        min="0"
        step={step}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
      />
    </div>
  );
}

// ── Repay Dialog ─────────────────────────────────────────────────────────────

function RepayDialog({
  client,
  installmentId,
  applyInstallments = false,
  defaultAmount = "",
  productName = "",
  open,
  onOpenChange,
}: {
  client: NonNullable<ReturnType<typeof useClient>["data"]>;
  installmentId?: number;
  applyInstallments?: boolean;
  defaultAmount?: string;
  productName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const catalogsQuery = useCatalogs();
  const repayDebt = useRepayDebt();

  const [amount, setAmount] = useState(defaultAmount);
  const [targetWalletId, setTargetWalletId] = useState("");
  const [sourceWalletId, setSourceWalletId] = useState("");

  useEffect(() => {
    if (open) {
      setAmount(defaultAmount);
      setTargetWalletId(
        client.debt_wallets[0]?.id ? String(client.debt_wallets[0].id) : "",
      );
    }
  }, [defaultAmount, open, client.debt_wallets]);

  const cashDesks = useMemo(() => {
    return catalogsQuery.data?.wallets.filter(
      (w) =>
        w.type === "cash" || w.type === "card" || w.type === "bank_account",
    ) ?? [];
  }, [catalogsQuery.data?.wallets]);

  useEffect(() => {
    if (open && cashDesks.length > 0 && !sourceWalletId) {
      setSourceWalletId(String(cashDesks[0].id));
    }
  }, [open, cashDesks, sourceWalletId]);

  const targetWalletOptions = useMemo(() => {
    return client.debt_wallets.map((w) => ({
      id: String(w.id),
      name: `${w.name} (${t("clients.debt")}: ${money(w.balance)})`,
    }));
  }, [client.debt_wallets, t]);

  const sourceWalletOptions = useMemo(() => {
    return cashDesks.map((w) => ({
      id: String(w.id),
      name: `${w.name} (${money(w.balance)})`,
    }));
  }, [cashDesks]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!targetWalletId || !sourceWalletId || !amount) {
      toast.error(t("finance.amountRequired"));
      return;
    }
    repayDebt.mutate(
      {
        target_wallet_id: Number(targetWalletId),
        source_wallet_id: Number(sourceWalletId),
        amount: String(amount),
        operation_type: "receive_client",
        installment_id: installmentId,
        apply_installments: applyInstallments,
      },
      {
        onSuccess: () => {
          toast.success(t("clients.updated"));
          queryClient.invalidateQueries({ queryKey: ["clients"] });
          queryClient.invalidateQueries({ queryKey: ["finance"] });
          onOpenChange(false);
        },
        onError: (error) => toast.error(getApiErrorMessage(error)),
      },
    );
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title={t("debts.pay")}
      description={productName ? `${t("sell.product")}: ${productName}` : undefined}
      footer={
        <AppModalActions
          submitForm="client-repay-debt-form"
          submitLabel={t("debts.pay")}
          pendingLabel={t("common.saving")}
          pending={repayDebt.isPending}
          onCancel={() => onOpenChange(false)}
          cancelLabel={t("common.cancel")}
        />
      }
    >
      <form id="client-repay-debt-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Target debt wallet */}
        <AppFormField label={t("clients.debtWallets")}>
          <AppSelect
            value={targetWalletId}
            onValueChange={setTargetWalletId}
            options={targetWalletOptions}
            placeholder={t("catalogs.walletSelect")}
          />
        </AppFormField>

        {/* Cash source */}
        <AppFormField label={t("finance.route")}>
          <AppSelect
            value={sourceWalletId}
            onValueChange={setSourceWalletId}
            options={sourceWalletOptions}
            placeholder={t("catalogs.walletSelect")}
          />
        </AppFormField>

        {/* Amount */}
        <AppFormField label={t("finance.amount")}>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            required
          />
        </AppFormField>
      </form>
    </ResponsiveModal>
  );
}

function PaymentCard({
  payment,
  currentPath,
}: {
  payment: NonNullable<ReturnType<typeof useClient>["data"]>["payments"][number];
  currentPath: string;
}) {
  const { t } = useTranslation();
  const route = [payment.wallet_name, payment.counterparty_wallet_name]
    .filter(Boolean)
    .join(" → ");

  return (
    <div className="rounded-lg border bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="text-xs font-semibold text-gray-500">
            {shortDate(payment.created_at)}
          </div>
          <Badge
            variant="outline"
            className={cn(
              "max-w-full",
              payment.direction === "payment"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : payment.direction === "debt"
                  ? "border-rose-200 bg-rose-50 text-rose-700"
                  : "border-gray-200 bg-gray-50 text-gray-600",
            )}
          >
            {t(`clients.paymentDirection.${payment.direction}`)}
          </Badge>
        </div>
        <div className="shrink-0 text-right text-sm font-black text-gray-900">
          {money(payment.amount)}
        </div>
      </div>

      <div className="mt-3 min-w-0 space-y-1 text-xs text-gray-600">
        {payment.description && (
          <div className="break-words leading-5">{payment.description}</div>
        )}
        {payment.product_id && payment.product_name && (
          <NavLink
            className="block break-words font-semibold text-sky-600 hover:underline"
            to={`/products/${payment.product_id}`}
            state={{ from: currentPath }}
          >
            {payment.product_name}
          </NavLink>
        )}
        <div className="pt-1 text-[11px] font-medium text-gray-400">
          {route || "—"}
        </div>
      </div>
    </div>
  );
}

function SaleCard({
  sale,
  currentPath,
}: {
  sale: NonNullable<ReturnType<typeof useClient>["data"]>["sales"][number];
  currentPath: string;
}) {
  const { t } = useTranslation();

  return (
    <div className="rounded-lg border bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold text-gray-500">
            {shortDate(sale.sold_at)}
          </div>
          <NavLink
            className="mt-1 block break-words text-sm font-bold text-sky-600 hover:underline"
            to={`/products/${sale.product_id}`}
            state={{ from: currentPath }}
          >
            {sale.product_name}
          </NavLink>
        </div>
        <div className="shrink-0 text-right text-sm font-black text-gray-900">
          {money(sale.total_price)}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 text-xs">
        <span className="font-semibold uppercase text-gray-400">
          {t("finance.date")}
        </span>
        <span className="text-gray-600">{shortDate(sale.sold_at)}</span>
        <span className="font-semibold uppercase text-gray-400">IMEI</span>
        <span className="break-all font-mono text-gray-600">
          {sale.product_imei || "—"}
        </span>
      </div>
    </div>
  );
}

// ── Client edit dialog ────────────────────────────────────────────────────────

function ClientEditDialog({
  client,
}: {
  client: NonNullable<ReturnType<typeof useClient>["data"]>;
}) {
  const { t } = useTranslation();
  const updateClient = useUpdateClient(client.id);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(client.name);
  const [phone, setPhone] = useState(formatPhoneInput(client.phone ?? ""));
  const [backupPhone, setBackupPhone] = useState(formatPhoneInput(client.backup_phone ?? ""));
  const [description, setDescription] = useState(client.description ?? "");

  useEffect(() => {
    if (!open) return;
    setName(client.name);
    setPhone(formatPhoneInput(client.phone ?? ""));
    setBackupPhone(formatPhoneInput(client.backup_phone ?? ""));
    setDescription(client.description ?? "");
  }, [client, open]);

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={setOpen}
      title={t("clients.edit")}
      trigger={
        <Button
          type="button"
          variant="outline"
          className="w-full justify-center whitespace-normal text-center leading-tight sm:w-auto sm:whitespace-nowrap"
        >
          <Edit className="size-4" />
          {t("common.edit")}
        </Button>
      }
      footer={
        <AppModalActions
          submitForm="client-edit-form"
          submitLabel={t("common.save")}
          pendingLabel={t("common.saving")}
          pending={updateClient.isPending}
          disabled={!name.trim()}
          onCancel={() => setOpen(false)}
          cancelLabel={t("common.cancel")}
        />
      }
    >
      <form
        id="client-edit-form"
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          updateClient.mutate(
            {
              name,
              phone: phone || undefined,
              backup_phone: backupPhone || undefined,
              description: description || undefined,
            },
            {
              onSuccess: () => {
                setOpen(false);
                toast.success(t("clients.updated"));
              },
              onError: (error) => toast.error(getApiErrorMessage(error)),
            },
          );
        }}
      >
        <AppFormField label={t("common.name")}>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </AppFormField>
        <div className="grid gap-3 sm:grid-cols-2">
          <AppFormField label={t("products.phone")}>
            <Input
              value={phone}
              onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
            />
          </AppFormField>
          <AppFormField label={t("clients.backupPhone")}>
            <Input
              value={backupPhone}
              onChange={(e) => setBackupPhone(formatPhoneInput(e.target.value))}
            />
          </AppFormField>
        </div>
        <AppFormField label={t("common.details")}>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Дополнительная информация"
          />
        </AppFormField>
      </form>
    </ResponsiveModal>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function getInstallmentBadgeClass(status: string) {
  if (status === "paid")
    return "badge-soft-success";
  if (status === "overdue")
    return "badge-soft-danger font-bold";
  return "badge-soft-warning";
}
