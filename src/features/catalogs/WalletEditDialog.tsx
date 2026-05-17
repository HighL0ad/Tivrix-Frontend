import { useState } from "react";
import { Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { useUpdateWallet } from "@/entities/catalogs/api/use-catalogs";
import type { Wallet, WalletType } from "@/entities/finance/api/use-finance";
import { getApiErrorMessage } from "@/shared/api/error";
import { walletTypeLabel } from "@/shared/lib/wallet-labels";
import { AppSelect, ResponsiveModal } from "@/shared/ui/app-form";
import { Button } from "@/shared/ui/button";
import { FormError, FormField } from "@/shared/ui/form";
import { Input } from "@/shared/ui/input";

export function WalletEditDialog({
  wallet,
  walletTypes,
}: {
  wallet: Wallet;
  walletTypes: Array<{ value: WalletType; label: string }>;
}) {
  const { t } = useTranslation();
  const updateWallet = useUpdateWallet();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(wallet.name);
  const [walletType, setWalletType] = useState(wallet.type);

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={setOpen}
      title={t("catalogs.editTitle")}
      trigger={
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label={t("common.edit")}
        >
          <Pencil />
        </Button>
      }
      footer={
        <Button
          type="submit"
          form="wallet-edit-form"
          disabled={!name.trim() || updateWallet.isPending}
        >
          {t("common.save")}
        </Button>
      }
    >
        <form
          id="wallet-edit-form"
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            updateWallet.mutate(
              {
                walletId: wallet.id,
                payload: { name: name.trim(), wallet_type: walletType },
              },
              {
                onSuccess: () => {
                  setOpen(false);
                  toast.success(t("catalogs.updated"));
                },
                onError: (error) => toast.error(getApiErrorMessage(error)),
              },
            );
          }}
        >
          <FormField label={t("common.name")}>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </FormField>
          <FormField label={t("common.type")}>
            <AppSelect
              value={walletType}
              onValueChange={(value) => setWalletType(value as WalletType)}
              options={walletTypes.map((type) => ({
                id: type.value,
                name: type.label === type.value ? walletTypeLabel(type.value) : type.label,
              }))}
            />
          </FormField>
          {updateWallet.isError ? (
            <FormError message={getApiErrorMessage(updateWallet.error)} />
          ) : null}
        </form>
    </ResponsiveModal>
  );
}
