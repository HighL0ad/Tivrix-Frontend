import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { type Wallet, useTransferWallets } from "@/entities/finance/api/use-finance";
import { getApiErrorMessage } from "@/shared/api/error";
import { money } from "@/shared/lib/format";
import { AppCombobox, ResponsiveModal } from "@/shared/ui/app-form";
import { Button } from "@/shared/ui/button";
import { FormError, FormField } from "@/shared/ui/form";
import { Input } from "@/shared/ui/input";

export function TransferDialog({
  wallets,
  open: controlledOpen,
  onOpenChange,
}: {
  wallets: Wallet[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const transfer = useTransferWallets();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [sourceId, setSourceId] = useState("");
  const [targetId, setTargetId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const formId = "transfer-wallets";

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={setOpen}
      title={t("finance.transfer")}
      trigger={
        <Button type="button" variant="outline">
          {t("finance.transfer")}
        </Button>
      }
      footer={
        <Button
          type="submit"
          form={formId}
          disabled={!sourceId || !targetId || !amount || transfer.isPending}
        >
          {t("finance.transferSubmit")}
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
                  toast.success(t("finance.transferDone"));
                },
                onError: (error) => toast.error(getApiErrorMessage(error)),
              },
            );
          }}
        >
          <WalletSelect
            label={t("finance.from")}
            value={sourceId}
            onChange={setSourceId}
            wallets={wallets}
          />
          <WalletSelect
            label={t("finance.to")}
            value={targetId}
            onChange={setTargetId}
            wallets={wallets.filter((wallet) => String(wallet.id) !== sourceId)}
          />
          <FormField label={t("finance.amount")}>
            <div className="relative">
              <Input
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                inputMode="decimal"
                className="h-11 pr-10 font-bold text-sky-700 border-sky-200 bg-sky-50/50 focus:bg-background transition-colors"
                required
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-sky-700/50 pointer-events-none">
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
  const { t } = useTranslation();

  return (
    <FormField label={label}>
      <AppCombobox
        value={value}
        onValueChange={onChange}
        placeholder={t("common.select")}
        options={wallets.map((wallet) => ({
          id: String(wallet.id),
          name: `${wallet.name} (${money(wallet.balance)})`,
        }))}
      />
    </FormField>
  );
}
