import type { Wallet } from "@/entities/finance/api/use-finance";
import { money } from "@/shared/lib/format";
import { AppCombobox } from "@/shared/ui/app-form";
import { FormField } from "@/shared/ui/form";

export function WalletSelect({
  label,
  value,
  onChange,
  wallets,
  onCreateNew,
  createNewFormat,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  wallets: Wallet[];
  onCreateNew?: (query: string) => void;
  createNewFormat?: string;
}) {
  return (
    <FormField label={label}>
      <AppCombobox
        value={value}
        onValueChange={onChange}
        placeholder={label}
        options={dedupeWallets(wallets).map((wallet) => ({
          id: String(wallet.id),
          name: formatWalletOptionLabel(wallet),
        }))}
        onCreateNew={onCreateNew}
        createNewFormat={createNewFormat}
      />
    </FormField>
  );
}

function formatWalletOptionLabel(wallet: Wallet) {
  const balance = money(wallet.balance);
  if (wallet.type !== "client_debt") {
    return `${wallet.name} (${balance})`;
  }

  const phone = wallet.client_phone || wallet.client_backup_phone;
  return phone ? `${wallet.name} · ${phone}` : wallet.name;
}

function dedupeWallets(wallets: Wallet[]) {
  const seen = new Set<string>();
  return wallets.filter((wallet) => {
    const key =
      wallet.type === "client_debt" && wallet.client_id
        ? `${wallet.type}:${wallet.client_id}`
        : `${wallet.type}:${wallet.id}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}
