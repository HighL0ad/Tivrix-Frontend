import { useState } from "react";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { type Wallet, useAdjustWallet } from "@/entities/finance/api/use-finance";
import { getApiErrorMessage } from "@/shared/api/error";
import { AppSelect, ResponsiveModal } from "@/shared/ui/app-form";
import { Button } from "@/shared/ui/button";
import { FormError, FormField } from "@/shared/ui/form";
import { Input } from "@/shared/ui/input";

export function AdjustWalletDialog({
  wallet,
  open: controlledOpen,
  onOpenChange,
}: {
  wallet: Wallet;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const adjust = useAdjustWallet();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
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
        <Button type="button" variant="outline" size="icon-sm" aria-label={t("finance.adjustBalance", { name: wallet.name })}>
          <Plus />
        </Button>
      }
      footer={
        <Button
          type="submit"
          form={`adjust-wallet-${wallet.id}`}
          disabled={adjust.isPending}
        >
          {t("common.save")}
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
                  toast.success(t("finance.balanceUpdated"));
                },
                onError: (error) => toast.error(getApiErrorMessage(error)),
              },
            );
          }}
        >
          <FormField label={t("finance.mode")}>
            <AppSelect
              value={mode}
              onValueChange={(value) => setMode(value as "set_balance" | "delta")}
              options={[
                { id: "delta", name: t("finance.incomeExpense") },
                { id: "set_balance", name: t("finance.setBalance") },
              ]}
            />
          </FormField>
          {mode === "set_balance" ? (
            <FormField label={t("finance.newBalance")}>
              <div className="relative">
                <Input
                  value={newBalance}
                  onChange={(event) => setNewBalance(event.target.value)}
                  inputMode="decimal"
                  className="h-11 pr-10 font-bold text-sky-700 border-sky-200 bg-sky-50/50 focus:bg-background transition-colors"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-sky-700/50 pointer-events-none">
                  ₼
                </span>
              </div>
            </FormField>
          ) : (
            <>
              <FormField label={t("finance.type")}>
                <AppSelect
                  value={deltaDirection}
                  onValueChange={(value) =>
                    setDeltaDirection(value as "income" | "expense")
                  }
                  options={[
                    { id: "income", name: t("finance.income") },
                    { id: "expense", name: t("finance.expense") },
                  ]}
                />
              </FormField>
              <FormField label={t("finance.amount")}>
                <div className="relative">
                  <Input
                    value={deltaAmount}
                    onChange={(event) => setDeltaAmount(event.target.value)}
                    inputMode="decimal"
                    className="h-11 pr-10 font-bold text-sky-700 border-sky-200 bg-sky-50/50 focus:bg-background transition-colors"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-sky-700/50 pointer-events-none">
                    ₼
                  </span>
                </div>
              </FormField>
            </>
          )}
          <FormField label={t("finance.comment")}>
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
