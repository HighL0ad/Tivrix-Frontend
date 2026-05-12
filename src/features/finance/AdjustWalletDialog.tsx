import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { type Wallet, useAdjustWallet } from "@/entities/finance/api/use-finance";
import { getApiErrorMessage } from "@/shared/api/error";
import { AppSelect, ResponsiveModal } from "@/shared/ui/app-form";
import { Button } from "@/shared/ui/button";
import { FormError, FormField } from "@/shared/ui/form";
import { Input } from "@/shared/ui/input";

export function AdjustWalletDialog({ wallet }: { wallet: Wallet }) {
  const adjust = useAdjustWallet();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"set_balance" | "delta">("delta");
  const [newBalance, setNewBalance] = useState(wallet.balance);
  const [deltaAmount, setDeltaAmount] = useState("");
  const [deltaDirection, setDeltaDirection] = useState<"income" | "expense">(
    "income",
  );
  const [description, setDescription] = useState("");

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={setOpen}
      title={wallet.name}
      trigger={
        <Button type="button" variant="outline" size="icon-sm" aria-label={`Изменить баланс ${wallet.name}`}>
          <Plus />
        </Button>
      }
      footer={
        <Button
          type="submit"
          form={`adjust-wallet-${wallet.id}`}
          disabled={adjust.isPending}
        >
          Сохранить
        </Button>
      }
    >
        <form
          id={`adjust-wallet-${wallet.id}`}
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            adjust.mutate(
              {
                walletId: wallet.id,
                payload:
                  mode === "set_balance"
                    ? {
                        mode,
                        new_balance: newBalance,
                        description: description.trim() || undefined,
                      }
                    : {
                        mode,
                        delta_amount: deltaAmount,
                        delta_direction: deltaDirection,
                        description: description.trim() || undefined,
                      },
              },
              {
                onSuccess: () => {
                  setOpen(false);
                  toast.success("Баланс обновлён");
                },
                onError: (error) => toast.error(getApiErrorMessage(error)),
              },
            );
          }}
        >
          <FormField label="Режим">
            <AppSelect
              value={mode}
              onValueChange={(value) => setMode(value as "set_balance" | "delta")}
              options={[
                { id: "delta", name: "Приход / расход" },
                { id: "set_balance", name: "Установить баланс" },
              ]}
            />
          </FormField>
          {mode === "set_balance" ? (
            <FormField label="Новый баланс">
              <Input
                value={newBalance}
                onChange={(event) => setNewBalance(event.target.value)}
                inputMode="decimal"
                required
              />
            </FormField>
          ) : (
            <>
              <FormField label="Тип">
                <AppSelect
                  value={deltaDirection}
                  onValueChange={(value) =>
                    setDeltaDirection(value as "income" | "expense")
                  }
                  options={[
                    { id: "income", name: "Приход" },
                    { id: "expense", name: "Расход" },
                  ]}
                />
              </FormField>
              <FormField label="Сумма">
                <Input
                  value={deltaAmount}
                  onChange={(event) => setDeltaAmount(event.target.value)}
                  inputMode="decimal"
                  required
                />
              </FormField>
            </>
          )}
          <FormField label="Комментарий">
            <Input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </FormField>
          {adjust.isError ? (
            <FormError message={getApiErrorMessage(adjust.error)} />
          ) : null}
        </form>
    </ResponsiveModal>
  );
}
