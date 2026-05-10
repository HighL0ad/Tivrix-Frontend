import { useState } from "react";

import { useRepayDebt } from "@/entities/debts/api/use-debts";
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
}: {
  wallet: Wallet;
  myWallets: Wallet[];
  operationType: "pay_supplier" | "receive_client";
}) {
  const repay = useRepayDebt();
  const [open, setOpen] = useState(false);
  const [sourceWalletId, setSourceWalletId] = useState("");
  const [amount, setAmount] = useState("");
  const formId = `repay-${wallet.id}-${operationType}`;
  const isPayment = operationType === "pay_supplier";

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={setOpen}
      title={wallet.name}
      trigger={
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className={
            isPayment
              ? "h-8 rounded-full bg-rose-100 px-3 text-xs font-bold text-rose-700 shadow-none hover:bg-rose-200 hover:text-rose-800"
              : "h-8 rounded-full bg-emerald-100 px-3 text-xs font-bold text-emerald-700 shadow-none hover:bg-emerald-200 hover:text-emerald-800"
          }
        >
          {isPayment ? "Оплатить" : "Принять"}
        </Button>
      }
      footer={
        <Button
          type="submit"
          form={formId}
          disabled={!sourceWalletId || !amount || repay.isPending}
        >
          Сохранить
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
              },
              { onSuccess: () => setOpen(false) },
            );
          }}
        >
          <WalletSelect
            label="Кошелек"
            value={sourceWalletId}
            onChange={setSourceWalletId}
            wallets={myWallets}
          />
          <FormField label="Сумма">
            <Input
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              inputMode="decimal"
              required
            />
          </FormField>
          {repay.isError ? (
            <FormError message={getApiErrorMessage(repay.error)} />
          ) : null}
        </form>
    </ResponsiveModal>
  );
}
