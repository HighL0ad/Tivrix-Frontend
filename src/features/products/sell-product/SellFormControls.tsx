import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { Input } from "@/shared/ui/input";
import { useTranslation } from "react-i18next";
import {
  AppCombobox,
  AppFormField,
} from "@/shared/ui/app-form";
import type { ProductOption } from "@/entities/products/model/types";
import { formatNumberInput } from "@/shared/lib/input-formatters";

export function InlineCreate({
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
  const { t } = useTranslation();

  return (
    <div className="mt-2 flex items-start gap-2">
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 bg-card !text-base font-medium leading-5 placeholder:!text-base placeholder:font-medium placeholder:text-muted-foreground"
      />
      <Button
        type="button"
        variant="outline"
        className="h-11 px-4 !text-base font-medium"
        onClick={onCreate}
        disabled={disabled || !value.trim()}
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
    <div className="mt-4 space-y-4 border-t border-border pt-4">
      <label className="flex cursor-pointer items-start gap-3">
        <Checkbox
          checked={enabled}
          onCheckedChange={(checked) => setEnabled(Boolean(checked))}
          className="mt-1 size-5"
        />
        <span>
          <span className="block text-[13px] font-bold leading-5 text-foreground">
            {title}
          </span>
        </span>
      </label>
      {enabled ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <AppFormField label={t("sell.secondWalletAmount")}>
            <div className="relative">
              <Input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(event) => setAmount(formatNumberInput(event.target.value))}
                className="h-11 pr-10 font-bold text-sky-700 border-sky-200 bg-sky-50/50 focus:bg-background transition-colors"
                required
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-sky-700/50 pointer-events-none">
                ₼
              </span>
            </div>
          </AppFormField>
          <SelectField
            label={t("sell.secondWallet")}
            value={walletId}
            onValueChange={setWalletId}
            options={walletOptions}
            placeholder={t("sell.selectWallet")}
            className="h-11"
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
  className,
  onCreateNew,
  createNewFormat,
  disabled = false,
  clearable = false,
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: ProductOption[];
  placeholder: string;
  className?: string;
  onCreateNew?: (query: string) => void;
  createNewFormat?: string;
  disabled?: boolean;
  clearable?: boolean;
}) {
  return (
    <AppFormField label={label}>
      <AppCombobox
        value={value}
        onValueChange={onValueChange}
        options={options}
        placeholder={placeholder}
        className={className}
        onCreateNew={onCreateNew}
        createNewFormat={createNewFormat}
        disabled={disabled}
        clearable={clearable}
      />
    </AppFormField>
  );
}
