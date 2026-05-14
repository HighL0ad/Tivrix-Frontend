import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { Input } from "@/shared/ui/input";
import { useTranslation } from "react-i18next";
import {
  AppCombobox,
  AppFormField,
} from "@/shared/ui/app-form";
import type { ProductOption } from "@/entities/products/model/types";

export function InlineCreate({
  value,
  onChange,
  onCreate,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  onCreate: () => void;
  placeholder: string;
}) {
  const { t } = useTranslation();

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
        disabled={!value.trim()}
      >
        <span className="text-base font-medium leading-5">{t("common.create")}</span>
      </Button>
    </div>
  );
}

export function SplitPaymentFields({
  enabled,
  setEnabled,
  amount,
  setAmount,
  walletId,
  setWalletId,
  walletOptions,
  title,
}: {
  enabled: boolean;
  setEnabled: (value: boolean) => void;
  amount: string;
  setAmount: (value: string) => void;
  walletId: string;
  setWalletId: (value: string) => void;
  walletOptions: ProductOption[];
  title: string;
}) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3 border p-3">
      <label className="flex items-center gap-2 text-[13px] font-medium leading-5 text-foreground">
        <Checkbox
          checked={enabled}
          onCheckedChange={(checked) => setEnabled(Boolean(checked))}
        />
        {title}
      </label>
      {enabled ? (
        <div className="grid gap-3 sm:grid-cols-2">
            <AppFormField label={t("sell.secondWalletAmount")}>
              <Input
                type="number"
                step="1"
                min="1"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                required
              />
            </AppFormField>
          <SelectField
            label={t("sell.secondWallet")}
            value={walletId}
            onValueChange={setWalletId}
            options={walletOptions}
            placeholder={t("sell.selectWallet")}
          />
        </div>
      ) : null}
    </div>
  );
}

export function SelectField({
  label,
  value,
  onValueChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: ProductOption[];
  placeholder: string;
}) {
  return (
    <AppFormField label={label}>
      <AppCombobox
        value={value}
        onValueChange={onValueChange}
        options={options}
        placeholder={placeholder}
      />
    </AppFormField>
  );
}
