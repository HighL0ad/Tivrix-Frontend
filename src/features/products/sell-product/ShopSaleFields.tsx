import { Checkbox } from "@/shared/ui/checkbox";
import { AppFormField } from "@/shared/ui/app-form";
import { DatePicker } from "@/shared/ui/date-picker";
import { Input } from "@/shared/ui/input";
import { useTranslation } from "react-i18next";
import type { ProductOption } from "@/entities/products/model/types";
import {
  SelectField,
  SplitPaymentFields,
} from "@/features/products/sell-product/SellFormControls";
import { formatNumberInput } from "@/shared/lib/input-formatters";

export function ShopBuyerFields({
  shopWalletId,
  setShopWalletId,
  shopOptions,
  onCreateShop,
}: {
  shopWalletId: string;
  setShopWalletId: (value: string) => void;
  shopOptions: ProductOption[];
  onCreateShop: (name: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <SelectField
        label={t("sell.shopPartner")}
        value={shopWalletId}
        onValueChange={setShopWalletId}
        options={shopOptions}
        placeholder={t("sell.selectPartner")}
        className="h-11"
        onCreateNew={onCreateShop}
      />
    </div>
  );
}

export function ShopPaymentFields({
  shopPrepaymentEnabled,
  setShopPrepaymentEnabled,
  shopPrepaymentAmount,
  setShopPrepaymentAmount,
  shopPrepaymentWalletId,
  setShopPrepaymentWalletId,
  shopSplitPaymentEnabled,
  setShopSplitPaymentEnabled,
  shopSplitPaymentAmount,
  setShopSplitPaymentAmount,
  shopSplitPaymentWalletId,
  setShopSplitPaymentWalletId,
  shopDebtDueDate,
  setShopDebtDueDate,
  shopDebt,
  walletOptions,
}: {
  shopPrepaymentEnabled: boolean;
  setShopPrepaymentEnabled: (value: boolean) => void;
  shopPrepaymentAmount: string;
  setShopPrepaymentAmount: (value: string) => void;
  shopPrepaymentWalletId: string;
  setShopPrepaymentWalletId: (value: string) => void;
  shopSplitPaymentEnabled: boolean;
  setShopSplitPaymentEnabled: (value: boolean) => void;
  shopSplitPaymentAmount: string;
  setShopSplitPaymentAmount: (value: string) => void;
  shopSplitPaymentWalletId: string;
  setShopSplitPaymentWalletId: (value: string) => void;
  shopDebtDueDate: string;
  setShopDebtDueDate: (value: string) => void;
  shopDebt: number;
  walletOptions: ProductOption[];
}) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-2 text-[13px] font-medium leading-5 text-foreground">
        <Checkbox
          checked={shopPrepaymentEnabled}
          onCheckedChange={(checked) =>
            setShopPrepaymentEnabled(Boolean(checked))
          }
        />
        {t("sell.hasPaymentNow")}
      </label>

      {shopPrepaymentEnabled ? (
        <>
          <AppFormField label={t("sell.paymentNowAmount")}>
            <div className="relative">
              <Input
                id="shop-prepayment"
                type="text"
                inputMode="decimal"
                value={shopPrepaymentAmount}
                onChange={(event) => setShopPrepaymentAmount(formatNumberInput(event.target.value))}
                className="h-11 pr-10 font-bold text-amber-700 border-amber-200 bg-amber-50/50 focus:bg-background transition-colors"
                required
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-amber-700/50 pointer-events-none">
                ₼
              </span>
            </div>
          </AppFormField>
          <SelectField
            label={t("sell.creditPaymentTo")}
            value={shopPrepaymentWalletId}
            onValueChange={setShopPrepaymentWalletId}
            options={walletOptions}
            placeholder={t("sell.selectWallet")}
            className="h-11"
          />
          <SplitPaymentFields
            enabled={shopSplitPaymentEnabled}
            setEnabled={setShopSplitPaymentEnabled}
            amount={shopSplitPaymentAmount}
            setAmount={setShopSplitPaymentAmount}
            walletId={shopSplitPaymentWalletId}
            setWalletId={setShopSplitPaymentWalletId}
            walletOptions={walletOptions.filter(
              (option) => option.id !== shopPrepaymentWalletId,
            )}
            title={t("sell.splitPrepayment")}
          />
        </>
      ) : null}

      {shopDebt > 0 ? (
        <AppFormField
          label={t("sell.shopDebtDueDate")}
          helper={t("sell.shopDebtDueDateHelper")}
        >
          <DatePicker
            value={shopDebtDueDate}
            onChange={setShopDebtDueDate}
            placeholder={t("common.selectDate")}
            className="h-11 w-full"
          />
        </AppFormField>
      ) : null}
    </div>
  );
}
