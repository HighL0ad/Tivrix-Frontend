import { useState } from "react";
import { toast } from "sonner";

import { type Wallet, useTransferWallets } from "@/entities/finance/api/use-finance";
import { getApiErrorMessage } from "@/shared/api/error";
import { money } from "@/shared/lib/format";
import { AppCombobox, ResponsiveModal } from "@/shared/ui/app-form";
import { Button } from "@/shared/ui/button";
import { FormError, FormField } from "@/shared/ui/form";
import { Input } from "@/shared/ui/input";

export function TransferDialog({ wallets }: { wallets: Wallet[] }) {
  const transfer = useTransferWallets();
  const [open, setOpen] = useState(false);
  const [sourceId, setSourceId] = useState("");
  const [targetId, setTargetId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const formId = "transfer-wallets";

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={setOpen}
      title="Перевод между счетами"
      trigger={
        <Button type="button" variant="outline">
          Перевод между счетами
        </Button>
      }
      footer={
        <Button
          type="submit"
          form={formId}
          disabled={!sourceId || !targetId || !amount || transfer.isPending}
        >
          Перевести
        </Button>
      }
    >
        <form
          id={formId}
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            transfer.mutate(
              {
                source_wallet_id: Number(sourceId),
                target_wallet_id: Number(targetId),
                amount,
                description: description.trim() || undefined,
              },
              {
                onSuccess: () => {
                  setOpen(false);
                  toast.success("Перевод выполнен");
                },
                onError: (error) => toast.error(getApiErrorMessage(error)),
              },
            );
          }}
        >
          <WalletSelect
            label="Откуда"
            value={sourceId}
            onChange={setSourceId}
            wallets={wallets}
          />
          <WalletSelect
            label="Куда"
            value={targetId}
            onChange={setTargetId}
            wallets={wallets.filter((wallet) => String(wallet.id) !== sourceId)}
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
          {transfer.isError ? (
            <FormError message={getApiErrorMessage(transfer.error)} />
          ) : null}
        </form>
    </ResponsiveModal>
  );
}

function WalletSelect({
  label,
  value,
  onChange,
  wallets,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  wallets: Wallet[];
}) {
  return (
    <FormField label={label}>
      <AppCombobox
        value={value}
        onValueChange={onChange}
        placeholder="Выберите"
        options={wallets.map((wallet) => ({
          id: String(wallet.id),
          name: `${wallet.name} (${money(wallet.balance)})`,
        }))}
      />
    </FormField>
  );
}
