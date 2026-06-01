import { type ComponentProps, type ReactNode, useId, useState } from "react";
import { Building2, Check, Store, UserRound, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import {
  useBorrowMoney,
  useCreateDebtWallet,
  useLendMoney,
} from "@/entities/debts/api/use-debts";
import type { Wallet, WalletType } from "@/entities/finance/api/use-finance";
import { getApiErrorMessage } from "@/shared/api/error";
import { ResponsiveModal } from "@/shared/ui/app-form";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { FormError, FormField } from "@/shared/ui/form";
import { Input } from "@/shared/ui/input";
import { WalletSelect } from "@/features/debts/WalletSelect";
import { Checkbox } from "@/shared/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group";
import { Sheet, SheetContent } from "@/shared/ui/sheet";
import { useMediaQuery } from "@/shared/lib/use-media-query";
import { cn } from "@/shared/lib/utils";

type CounterpartyType = Extract<WalletType, "client_debt" | "debt" | "shop">;

export function MoneyFlowDialog({
  title,
  trigger,
  sourceWallets,
  targetWallets,
  mode,
  open: controlledOpen,
  onOpenChange,
}: {
  title: string;
  trigger: string;
  sourceWallets: Wallet[];
  targetWallets: Wallet[];
  mode: "lend" | "borrow";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const lend = useLendMoney();
  const borrow = useBorrowMoney();
  const createWallet = useCreateDebtWallet();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [sourceId, setSourceId] = useState("");
  const [targetId, setTargetId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [shopDebtOffset, setShopDebtOffset] = useState(true);
  const [createdCounterparty, setCreatedCounterparty] = useState<Wallet | null>(null);
  const [quickCounterpartyOpen, setQuickCounterpartyOpen] = useState(false);
  const [quickCounterpartyName, setQuickCounterpartyName] = useState("");
  const [quickCounterpartyType, setQuickCounterpartyType] = useState<CounterpartyType>(
    mode === "lend" ? "client_debt" : "debt",
  );
  const pending = mode === "lend" ? lend.isPending : borrow.isPending;
  const generatedFormId = useId();
  const formId = `money-flow-${mode}-${generatedFormId}`;
  const sourceOptions =
    mode === "borrow" && createdCounterparty
      ? mergeWallets(sourceWallets, createdCounterparty)
      : sourceWallets;
  const targetOptions =
    mode === "lend" && createdCounterparty
      ? mergeWallets(targetWallets, createdCounterparty)
      : targetWallets;
  const QuickCounterpartyContainer = isMobile ? Sheet : Dialog;
  const QuickCounterpartyContent = isMobile ? SheetContent : DialogContent;
  const counterpartyTypeOptions: Array<{
    value: CounterpartyType;
    label: string;
    hint: string;
    icon: (props: { className?: string }) => ReactNode;
  }> = [
    ...(mode === "lend"
      ? [
          {
            value: "client_debt" as const,
            label: t("products.sourceTypeClient"),
            hint: t("debts.quickCounterpartyClientHint"),
            icon: UserRound,
          },
        ]
      : []),
    {
      value: "debt",
      label: t("products.sourceTypeSupplier"),
      hint: t("debts.quickCounterpartySupplierHint"),
      icon: Building2,
    },
    {
      value: "shop",
      label: t("products.sourceTypePartner"),
      hint: t("debts.quickCounterpartyPartnerHint"),
      icon: Store,
    },
  ];

  const selectedTarget = targetOptions.find((w) => String(w.id) === targetId);
  const isShopOrSupplierTarget = selectedTarget && (selectedTarget.type === "shop" || selectedTarget.type === "debt");

  const selectedSource = sourceOptions.find((w) => String(w.id) === sourceId);
  const isShopOrSupplierSource = selectedSource && (selectedSource.type === "shop" || selectedSource.type === "debt");

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setSourceId("");
      setTargetId("");
      setAmount("");
      setDescription("");
      setShopDebtOffset(true);
      setCreatedCounterparty(null);
      setQuickCounterpartyOpen(false);
      setQuickCounterpartyName("");
      setQuickCounterpartyType(mode === "lend" ? "client_debt" : "debt");
    }
  }

  function openQuickCounterpartyDialog(name: string) {
    setQuickCounterpartyName(name);
    setQuickCounterpartyType(mode === "lend" ? "client_debt" : "debt");
    setQuickCounterpartyOpen(true);
  }

  const handleQuickCounterpartySubmit: NonNullable<ComponentProps<"form">["onSubmit"]> = (event) => {
    event.preventDefault();
    const name = quickCounterpartyName.trim();
    if (!name) return;

    createWallet.mutate(
      { name, wallet_type: quickCounterpartyType },
      {
        onSuccess: (wallet) => {
          setCreatedCounterparty(wallet);
          if (mode === "lend") {
            setTargetId(String(wallet.id));
          } else {
            setSourceId(String(wallet.id));
          }
          setQuickCounterpartyOpen(false);
          setQuickCounterpartyName("");
          toast.success(t("debts.counterpartyAdded"));
        },
        onError: (error) => toast.error(getApiErrorMessage(error)),
      },
    );
  };

  return (
    <>
      <ResponsiveModal
        open={open}
        onOpenChange={handleOpenChange}
        title={title}
        trigger={
          <Button type="button" variant="outline">
            {trigger}
          </Button>
        }
        footer={
          <Button
            type="submit"
            form={formId}
            disabled={!sourceId || !targetId || !amount || pending}
          >
            {t("common.save")}
          </Button>
        }
      >
          <form
            id={formId}
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              const onSuccess = () => {
                handleOpenChange(false);
                toast.success(mode === "lend" ? t("debts.moneyLent") : t("debts.moneyBorrowed"));
              };
              const onError = (error: unknown) => toast.error(getApiErrorMessage(error));
              if (mode === "lend") {
                lend.mutate(
                  {
                    source_wallet_id: Number(sourceId),
                    shop_wallet_id: Number(targetId),
                    amount,
                    description: description.trim() || undefined,
                    shop_debt_offset: isShopOrSupplierTarget ? shopDebtOffset : undefined,
                  },
                  { onSuccess, onError },
                );
              } else {
                borrow.mutate(
                  {
                    partner_wallet_id: Number(sourceId),
                    target_wallet_id: Number(targetId),
                    amount,
                    description: description.trim() || undefined,
                    shop_debt_offset: isShopOrSupplierSource ? shopDebtOffset : undefined,
                  },
                  { onSuccess, onError },
                );
              }
            }}
          >
            <WalletSelect
              label={mode === "lend" ? t("debts.from") : t("debts.who")}
              value={sourceId}
              onChange={setSourceId}
              wallets={sourceOptions}
              onCreateNew={mode === "borrow" ? openQuickCounterpartyDialog : undefined}
            />

            {mode === "borrow" && isShopOrSupplierSource && (
              <div className="space-y-4 rounded-lg border bg-muted/40 p-4">
                <label className="flex cursor-pointer items-start gap-3 select-none">
                  <Checkbox
                    checked={shopDebtOffset}
                    onCheckedChange={(checked) =>
                      setShopDebtOffset(Boolean(checked))
                    }
                    className="mt-1 size-5"
                  />
                  <span>
                    <span className="block text-[13px] font-bold leading-5 text-foreground">
                      {t("debts.borrowOffset")}
                    </span>
                    <span className="mt-1 block text-xs leading-4 text-gray-500 font-medium">
                      {t("debts.borrowOffsetDescription")}
                    </span>
                  </span>
                </label>
              </div>
            )}
            <WalletSelect
              label={mode === "lend" ? t("debts.lendTo") : t("debts.target")}
              value={targetId}
              onChange={setTargetId}
              wallets={targetOptions}
              onCreateNew={mode === "lend" ? openQuickCounterpartyDialog : undefined}
            />

            {mode === "lend" && isShopOrSupplierTarget && (
              <div className="space-y-4 rounded-lg border bg-muted/40 p-4">
                <label className="flex cursor-pointer items-start gap-3 select-none">
                  <Checkbox
                    checked={shopDebtOffset}
                    onCheckedChange={(checked) =>
                      setShopDebtOffset(Boolean(checked))
                    }
                    className="mt-1 size-5"
                  />
                  <span>
                    <span className="block text-[13px] font-bold leading-5 text-foreground">
                      {t("debts.offsetOurDebt")}
                    </span>
                    <span className="mt-1 block text-xs leading-4 text-gray-500 font-medium">
                      {t("debts.offsetOurDebtDescription")}
                    </span>
                  </span>
                </label>
              </div>
            )}

            <FormField label={t("debts.amount")}>
              <div className="relative">
                <Input
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  inputMode="decimal"
                  className="h-11 pr-10 font-bold text-amber-700 border-amber-200 bg-amber-50/50 focus:bg-background transition-colors"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-amber-700/50 pointer-events-none">
                  ₼
                </span>
              </div>
            </FormField>
            <FormField label={t("finance.comment")}>
              <Input
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </FormField>
            {lend.isError || borrow.isError ? (
              <FormError
                message={getApiErrorMessage(
                  mode === "lend" ? lend.error : borrow.error,
                )}
              />
            ) : null}
          </form>
      </ResponsiveModal>

      <QuickCounterpartyContainer
        open={quickCounterpartyOpen}
        onOpenChange={setQuickCounterpartyOpen}
      >
        <QuickCounterpartyContent
          className={
            isMobile
              ? "rounded-t-2xl border-border bg-card p-0"
              : "sm:max-w-[540px] overflow-hidden p-0"
          }
        >
          <div className="border-b bg-muted/30 px-5 py-4">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                {t("debts.quickCounterpartyTitle")}
              </DialogTitle>
              <p className="text-[13px] leading-5 text-muted-foreground">
                {t("debts.quickCounterpartyDescription")}
              </p>
            </DialogHeader>
          </div>

          <form className="space-y-5 px-5 py-4" onSubmit={handleQuickCounterpartySubmit}>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {t("products.sourceType")}
              </label>
              <RadioGroup
                value={quickCounterpartyType}
                onValueChange={(value) =>
                  setQuickCounterpartyType(value as CounterpartyType)
                }
                className={cn(
                  "grid gap-3",
                  mode === "lend" ? "sm:grid-cols-3" : "sm:grid-cols-2",
                )}
              >
                {counterpartyTypeOptions.map((option) => {
                  const selected = quickCounterpartyType === option.value;
                  const Icon = option.icon;
                  return (
                    <label
                      key={option.value}
                      className={cn(
                        "relative flex flex-col items-center justify-between text-center cursor-pointer gap-2 rounded-xl border p-4 transition-all duration-200 select-none shadow-sm hover:shadow",
                        selected
                          ? "border-primary bg-primary/[0.04] text-primary ring-2 ring-primary/20 scale-[1.02]"
                          : "border-border bg-background hover:border-primary/30 hover:bg-muted/10",
                      )}
                    >
                      <RadioGroupItem value={option.value} className="sr-only" />
                      {selected && (
                        <div className="absolute right-2 top-2 rounded-full bg-primary p-0.5 text-primary-foreground">
                          <Check className="size-3 stroke-[3px]" />
                        </div>
                      )}
                      <div
                        className={cn(
                          "rounded-full p-2.5 transition-colors duration-200",
                          selected
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        <Icon className="size-5 shrink-0" />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-sm font-semibold tracking-tight">
                          {option.label}
                        </span>
                        <span className="mt-1 block text-[10px] leading-3 text-muted-foreground/80 font-medium">
                          {option.hint}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </RadioGroup>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {t("common.name")} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <UserRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/70" />
                <Input
                  value={quickCounterpartyName}
                  onChange={(event) => setQuickCounterpartyName(event.target.value)}
                  required
                  autoFocus={!isMobile}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setQuickCounterpartyOpen(false)}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={createWallet.isPending}>
                {createWallet.isPending ? t("common.saving") : t("common.save")}
              </Button>
            </div>
          </form>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setQuickCounterpartyOpen(false)}
            className="absolute right-3 top-3 size-8 rounded-md text-primary hover:bg-primary/10 hover:text-primary"
            aria-label={t("common.cancel")}
          >
            <X className="size-4" />
          </Button>
        </QuickCounterpartyContent>
      </QuickCounterpartyContainer>
    </>
  );
}


function mergeWallets(wallets: Wallet[], wallet: Wallet) {
  return wallets.some((current) => current.id === wallet.id)
    ? wallets
    : [...wallets, wallet];
}
