import { useState } from "react";

import { useBorrowMoney, useLendMoney } from "@/entities/debts/api/use-debts";
import type { Wallet } from "@/entities/finance/api/use-finance";
import { getApiErrorMessage } from "@/shared/api/error";
import { ResponsiveModal } from "@/shared/ui/app-form";
import { Button } from "@/shared/ui/button";
import { FormError, FormField } from "@/shared/ui/form";
import { Input } from "@/shared/ui/input";
import { WalletSelect } from "@/features/debts/WalletSelect";

export function MoneyFlowDialog({
  title,
  trigger,
  sourceWallets,
  targetWallets,
  mode,
}: {
  title: string;
  trigger: string;
  sourceWallets: Wallet[];
  targetWallets: Wallet[];
  mode: "lend" | "borrow";
}) {
  const lend = useLendMoney();
  const borrow = useBorrowMoney();
  const [open, setOpen] = useState(false);
  const [sourceId, setSourceId] = useState("");
  const [targetId, setTargetId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const pending = mode === "lend" ? lend.isPending : borrow.isPending;
  const formId = `money-flow-${mode}`;

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={setOpen}
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
          Сохранить
        </Button>
      }
    >
        <form
          id={formId}
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            const onSuccess = () => setOpen(false);
            if (mode === "lend") {
              lend.mutate(
                {
                  source_wallet_id: Number(sourceId),
                  shop_wallet_id: Number(targetId),
                  amount,
                  description: description.trim() || undefined,
                },
                { onSuccess },
              );
            } else {
              borrow.mutate(
                {
                  partner_wallet_id: Number(sourceId),
                  target_wallet_id: Number(targetId),
                  amount,
                  description: description.trim() || undefined,
                },
                { onSuccess },
              );
            }
          }}
        >
          <WalletSelect
            label={mode === "lend" ? "Откуда" : "У кого"}
            value={sourceId}
            onChange={setSourceId}
            wallets={sourceWallets}
          />
          <WalletSelect
            label={mode === "lend" ? "Кому" : "Куда"}
            value={targetId}
            onChange={setTargetId}
            wallets={targetWallets}
          />
          <FormField label="Сумма">
            <Input
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              inputMode="decimal"
              required
            />
          </FormField>
          <FormField label="Комментарий">
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
