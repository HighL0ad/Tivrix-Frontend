import { useState } from "react";
import { toast } from "sonner";

import { type Payable, usePayPayable } from "@/entities/debts/api/use-debts";
import type { Wallet } from "@/entities/finance/api/use-finance";
import { getApiErrorMessage } from "@/shared/api/error";
import { money } from "@/shared/lib/format";
import { ResponsiveModal } from "@/shared/ui/app-form";
import { Button } from "@/shared/ui/button";
import { FormError } from "@/shared/ui/form";
import { WalletSelect } from "@/features/debts/WalletSelect";

export function PayableDialog({
  payable,
  wallets,
}: {
  payable: Payable;
  wallets: Wallet[];
}) {
  const pay = usePayPayable();
  const [open, setOpen] = useState(false);
  const [walletId, setWalletId] = useState("");

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={setOpen}
      title={payable.category}
      trigger={
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-8 rounded-full bg-amber-100 px-3 text-xs font-bold text-amber-700 shadow-none hover:bg-amber-200 hover:text-amber-800"
        >
          Оплатить
        </Button>
      }
      footer={
        <Button
          type="submit"
          form={`payable-${payable.id}`}
          disabled={!walletId || pay.isPending}
        >
          Оплатить {money(payable.amount)}
        </Button>
      }
    >
        <form
          id={`payable-${payable.id}`}
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            pay.mutate(
              { payableId: payable.id, sourceWalletId: Number(walletId) },
              {
                onSuccess: () => {
                  setOpen(false);
                  toast.success("Обязательство оплачено");
                },
                onError: (error) => toast.error(getApiErrorMessage(error)),
              },
            );
          }}
        >
          <WalletSelect
            label="Кошелек оплаты"
            value={walletId}
            onChange={setWalletId}
            wallets={wallets}
          />
          {pay.isError ? (
            <FormError message={getApiErrorMessage(pay.error)} />
          ) : null}
        </form>
    </ResponsiveModal>
  );
}
