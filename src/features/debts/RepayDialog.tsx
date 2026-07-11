import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { type DebtEntry, type RepaymentOperationType, useRepayDebt } from "@/entities/debts/api/use-debts";
import type { Wallet } from "@/entities/finance/api/use-finance";
import { getApiErrorMessage } from "@/shared/api/error";
import { ResponsiveModal } from "@/shared/ui/app-form";
import { Button } from "@/shared/ui/button";
import { FormError, FormField } from "@/shared/ui/form";
import { Input } from "@/shared/ui/input";
import { WalletSelect } from "@/features/debts/WalletSelect";

export function RepayDialog({
  wallet,
  myWallets,
  operationType,
  tone,
  debtEntry,
}: {
  wallet: Wallet;
  myWallets: Wallet[];
  operationType: RepaymentOperationType;
  tone?: "bad" | "blue" | "good";
  debtEntry?: DebtEntry;
}) {
  const { t } = useTranslation();
  const repay = useRepayDebt();
  const [open, setOpen] = useState(false);
  const [sourceWalletId, setSourceWalletId] = useState("");
  const [amount, setAmount] = useState("");
  const formId = `repay-${wallet.id}-${operationType}-${debtEntry?.id ?? "wallet"}`;
  const isPayment = operationType === "pay_supplier";
  const shouldApplyInstallments =
    operationType === "receive_client" &&
    (!debtEntry || debtEntry.kind === "installment");
  const payableBalance = Math.abs(Number(debtEntry?.remaining_amount ?? wallet.balance));
  const buttonTone = tone ?? (isPayment ? "bad" : "good");
  const triggerClass = {
    bad: "h-8 rounded-full bg-rose-100 px-3 text-xs font-bold text-rose-700 shadow-none hover:bg-rose-200 hover:text-rose-800",
    blue: "h-8 rounded-full bg-blue-100 px-3 text-xs font-bold text-blue-700 shadow-none hover:bg-blue-200 hover:text-blue-800",
    good: "h-8 rounded-full bg-emerald-100 px-3 text-xs font-bold text-emerald-700 shadow-none hover:bg-emerald-200 hover:text-emerald-800",
  }[buttonTone];
  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      setAmount(defaultDebtAmount(payableBalance));
    }
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={handleOpenChange}
      title={debtEntry?.description ? `${wallet.name}: ${debtEntry.description}` : wallet.name}
      trigger={
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className={triggerClass}
          disabled={payableBalance <= 0}
        >
          {isPayment ? t("debts.pay") : t("debts.accept")}
        </Button>
      }
      footer={
        <Button
          type="submit"
          form={formId}
          disabled={!sourceWalletId || !amount || repay.isPending}
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
            repay.mutate(
              {
                target_wallet_id: wallet.id,
                source_wallet_id: Number(sourceWalletId),
                amount,
                operation_type: operationType,
                debt_entry_id: debtEntry?.id,
                apply_installments: shouldApplyInstallments,
              },
              {
                onSuccess: () => {
                  setOpen(false);
                  toast.success(isPayment ? t("debts.paymentDone") : t("debts.receivedPayment"));
                },
                onError: (error) => toast.error(getApiErrorMessage(error)),
              },
            );
          }}
        >
          <WalletSelect
            label={t("debts.wallet")}
            value={sourceWalletId}
            onChange={setSourceWalletId}
            wallets={myWallets}
          />
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
          {repay.isError ? (
            <FormError message={getApiErrorMessage(repay.error)} />
          ) : null}
        </form>
    </ResponsiveModal>
  );
}

function defaultDebtAmount(value: string | number) {
  const amount = Math.abs(Number(value));
  if (!Number.isFinite(amount)) return "";
  return amount.toFixed(2);
}
