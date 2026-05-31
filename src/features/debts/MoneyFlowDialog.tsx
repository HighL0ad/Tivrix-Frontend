import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import {
  useBorrowMoney,
  useCreateDebtWallet,
  useLendMoney,
} from "@/entities/debts/api/use-debts";
import type { Wallet } from "@/entities/finance/api/use-finance";
import { getApiErrorMessage } from "@/shared/api/error";
import { ResponsiveModal } from "@/shared/ui/app-form";
import { Button } from "@/shared/ui/button";
import { FormError, FormField } from "@/shared/ui/form";
import { Input } from "@/shared/ui/input";
import { WalletSelect } from "@/features/debts/WalletSelect";
import { Checkbox } from "@/shared/ui/checkbox";

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
  const pending = mode === "lend" ? lend.isPending : borrow.isPending;
  const formId = `money-flow-${mode}`;
  const sourceOptions =
    mode === "borrow" && createdCounterparty
      ? mergeWallets(sourceWallets, createdCounterparty)
      : sourceWallets;
  const targetOptions =
    mode === "lend" && createdCounterparty
      ? mergeWallets(targetWallets, createdCounterparty)
      : targetWallets;
  const counterpartyWalletType = mode === "lend" ? "client_debt" : "debt";

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
    }
  }

  function handleCreateCounterparty(name: string) {
    createWallet.mutate(
      { name, wallet_type: counterpartyWalletType },
      {
        onSuccess: (wallet) => {
          setCreatedCounterparty(wallet);
          if (mode === "lend") {
            setTargetId(String(wallet.id));
          } else {
            setSourceId(String(wallet.id));
          }
          toast.success(mode === "lend" ? t("debts.clientAdded") : t("debts.supplierAdded"));
        },
        onError: (error) => toast.error(getApiErrorMessage(error)),
      },
    );
  }

  return (
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
            onCreateNew={mode === "borrow" ? handleCreateCounterparty : undefined}
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
            onCreateNew={mode === "lend" ? handleCreateCounterparty : undefined}
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
  );
}


function mergeWallets(wallets: Wallet[], wallet: Wallet) {
  return wallets.some((current) => current.id === wallet.id)
    ? wallets
    : [...wallets, wallet];
}
