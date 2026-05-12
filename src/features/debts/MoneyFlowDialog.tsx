import { useState } from "react";
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
  const createWallet = useCreateDebtWallet();
  const [open, setOpen] = useState(false);
  const [sourceId, setSourceId] = useState("");
  const [targetId, setTargetId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [newCounterpartyName, setNewCounterpartyName] = useState("");
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
  const counterpartyLabel = mode === "lend" ? "Новый клиент" : "Новый поставщик";
  const counterpartyWalletType = mode === "lend" ? "client_debt" : "debt";
  const counterpartyPending = createWallet.isPending;

  function handleCreateCounterparty() {
    const name = newCounterpartyName.trim();
    if (!name) return;

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
          setNewCounterpartyName("");
          toast.success(mode === "lend" ? "Клиент добавлен" : "Поставщик добавлен");
        },
        onError: (error) => toast.error(getApiErrorMessage(error)),
      },
    );
  }

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
            const onSuccess = () => {
              setOpen(false);
              toast.success(mode === "lend" ? "Деньги выданы" : "Деньги получены");
            };
            const onError = (error: unknown) => toast.error(getApiErrorMessage(error));
            if (mode === "lend") {
              lend.mutate(
                {
                  source_wallet_id: Number(sourceId),
                  shop_wallet_id: Number(targetId),
                  amount,
                  description: description.trim() || undefined,
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
                },
                { onSuccess, onError },
              );
            }
          }}
        >
          <WalletSelect
            label={mode === "lend" ? "Откуда" : "У кого"}
            value={sourceId}
            onChange={setSourceId}
            wallets={sourceOptions}
          />
          {mode === "borrow" ? (
            <InlineCreate
              value={newCounterpartyName}
              onChange={setNewCounterpartyName}
              onCreate={handleCreateCounterparty}
              placeholder={counterpartyLabel}
              disabled={counterpartyPending}
            />
          ) : null}
          <WalletSelect
            label={mode === "lend" ? "Кому" : "Куда"}
            value={targetId}
            onChange={setTargetId}
            wallets={targetOptions}
          />
          {mode === "lend" ? (
            <InlineCreate
              value={newCounterpartyName}
              onChange={setNewCounterpartyName}
              onCreate={handleCreateCounterparty}
              placeholder={counterpartyLabel}
              disabled={counterpartyPending}
            />
          ) : null}
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

function InlineCreate({
  value,
  onChange,
  onCreate,
  placeholder,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  onCreate: () => void;
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start gap-2">
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="bg-card !text-base font-medium leading-5 placeholder:!text-base placeholder:font-medium placeholder:text-muted-foreground"
      />
      <Button
        type="button"
        variant="outline"
        className="h-10 px-4 !text-base font-medium"
        onClick={onCreate}
        disabled={disabled || !value.trim()}
      >
        <span className="text-base font-medium leading-5">Создать</span>
      </Button>
    </div>
  );
}

function mergeWallets(wallets: Wallet[], wallet: Wallet) {
  return wallets.some((current) => current.id === wallet.id)
    ? wallets
    : [...wallets, wallet];
}
