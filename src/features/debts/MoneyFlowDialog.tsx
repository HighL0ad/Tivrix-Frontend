import { type ComponentProps, type ReactNode, useId, useState } from "react";
import { Building2, ChevronLeft, Phone, Store, UserRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import {
  useBorrowMoney,
  useCreateDebtWallet,
  useLendMoney,
} from "@/entities/debts/api/use-debts";
import { DatePicker } from "@/shared/ui/date-picker";
import { useCreateClient } from "@/entities/clients/api/use-clients";
import type { Wallet, WalletType } from "@/entities/finance/api/use-finance";
import { getApiErrorMessage } from "@/shared/api/error";
import {
  AppCheckboxPanel,
  AppChoiceCards,
  AppModalActions,
  ResponsiveModal,
} from "@/shared/ui/app-form";
import { Button } from "@/shared/ui/button";
import { FormError, FormField } from "@/shared/ui/form";
import { Input } from "@/shared/ui/input";
import { WalletSelect } from "@/features/debts/WalletSelect";
import { useMediaQuery } from "@/shared/lib/use-media-query";
import { formatPhoneInput } from "@/shared/lib/input-formatters";

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
  const createClient = useCreateClient();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [sourceId, setSourceId] = useState("");
  const [targetId, setTargetId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [shopDebtOffset, setShopDebtOffset] = useState(true);
  const [dueDate, setDueDate] = useState("");
  const [createdCounterparty, setCreatedCounterparty] = useState<Wallet | null>(null);
  const [showQuickForm, setShowQuickForm] = useState(false);
  const [quickCounterpartyName, setQuickCounterpartyName] = useState("");
  const [quickCounterpartyPhone, setQuickCounterpartyPhone] = useState("");
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
      setDueDate("");
      setCreatedCounterparty(null);
      setQuickCounterpartyName("");
      setQuickCounterpartyPhone("");
      setQuickCounterpartyType(mode === "lend" ? "client_debt" : "debt");
      setShowQuickForm(false);
    }
  }

  function openQuickCounterpartyDialog(name: string) {
    setQuickCounterpartyName(name);
    setQuickCounterpartyPhone("");
    setQuickCounterpartyType(mode === "lend" ? "client_debt" : "debt");
    setShowQuickForm(true);
  }

  const handleQuickCounterpartySubmit: NonNullable<ComponentProps<"form">["onSubmit"]> = async (event) => {
    event.preventDefault();
    const name = quickCounterpartyName.trim();
    if (!name) return;

    try {
      if (quickCounterpartyType === "client_debt") {
        await createClient.mutateAsync({
          name,
          phone: quickCounterpartyPhone.trim() || undefined,
        });
      }

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
            setShowQuickForm(false);
            setQuickCounterpartyName("");
            setQuickCounterpartyPhone("");
            toast.success(t("debts.counterpartyAdded"));
          },
          onError: (error) => toast.error(getApiErrorMessage(error)),
        },
      );
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <>
      <ResponsiveModal
        open={open}
        onOpenChange={handleOpenChange}
        title={
          showQuickForm ? (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowQuickForm(false)}
                className="-ml-2 size-8 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <ChevronLeft className="size-5" />
              </Button>
              <span>{t("debts.quickCounterpartyTitle")}</span>
            </div>
          ) : (
            title
          )
        }
        description={showQuickForm ? t("debts.quickCounterpartyDescription") : undefined}
        trigger={
          <Button type="button" variant="outline">
            {trigger}
          </Button>
        }
        footer={
          showQuickForm ? (
            <AppModalActions
              submitForm="quick-counterparty-form"
              submitLabel={t("common.save")}
              pendingLabel={t("common.saving")}
              pending={createWallet.isPending || createClient.isPending}
              disabled={!quickCounterpartyName.trim()}
              onCancel={() => setShowQuickForm(false)}
              cancelLabel={t("common.cancel")}
            />
          ) : (
            <Button
              type="submit"
              form={formId}
              disabled={!sourceId || !targetId || !amount || pending}
            >
              {t("common.save")}
            </Button>
          )
        }
      >
        {showQuickForm ? (
          <form
            id="quick-counterparty-form"
            className="space-y-5"
            onSubmit={handleQuickCounterpartySubmit}
          >
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {t("products.sourceType")}
              </label>
              <AppChoiceCards
                value={quickCounterpartyType}
                onValueChange={setQuickCounterpartyType}
                options={counterpartyTypeOptions}
                columns={mode === "lend" ? 3 : 2}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
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

              {quickCounterpartyType === "client_debt" ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {t("products.phone")}
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/70" />
                    <Input
                      value={quickCounterpartyPhone}
                      onChange={(event) =>
                        setQuickCounterpartyPhone(formatPhoneInput(event.target.value))
                      }
                      placeholder="+994..."
                      className="pl-9"
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </form>
        ) : (
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
                    due_date: dueDate || undefined,
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
              <AppCheckboxPanel
                checked={shopDebtOffset}
                onCheckedChange={setShopDebtOffset}
                title={t("debts.borrowOffset")}
                description={t("debts.borrowOffsetDescription")}
              />
            )}
            <WalletSelect
              label={mode === "lend" ? t("debts.lendTo") : t("debts.target")}
              value={targetId}
              onChange={setTargetId}
              wallets={targetOptions}
              onCreateNew={mode === "lend" ? openQuickCounterpartyDialog : undefined}
            />

            {mode === "lend" && isShopOrSupplierTarget && (
              <AppCheckboxPanel
                checked={shopDebtOffset}
                onCheckedChange={setShopDebtOffset}
                title={t("debts.offsetOurDebt")}
                description={t("debts.offsetOurDebtDescription")}
              />
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
            {mode === "lend" && (
              <FormField label={t("debts.dueDate")}>
                <DatePicker
                  value={dueDate}
                  onChange={setDueDate}
                  placeholder={t("debts.dueDatePlaceholder")}
                  className="w-full"
                />
              </FormField>
            )}
            {lend.isError || borrow.isError ? (
              <FormError
                message={getApiErrorMessage(
                  mode === "lend" ? lend.error : borrow.error,
                )}
              />
            ) : null}
          </form>
        )}
      </ResponsiveModal>
    </>
  );
}

function mergeWallets(wallets: Wallet[], wallet: Wallet) {
  return wallets.some((current) => current.id === wallet.id)
    ? wallets
    : [...wallets, wallet];
}
