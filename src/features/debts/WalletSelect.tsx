import type { Wallet } from "@/entities/finance/api/use-finance";
import { money } from "@/shared/lib/format";
import { AppCombobox } from "@/shared/ui/app-form";
import { FormField } from "@/shared/ui/form";

export function WalletSelect({
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
        placeholder={label}
        options={wallets.map((wallet) => ({
          id: String(wallet.id),
          name: `${wallet.name} (${money(wallet.balance)})`,
        }))}
      />
    </FormField>
  );
}
