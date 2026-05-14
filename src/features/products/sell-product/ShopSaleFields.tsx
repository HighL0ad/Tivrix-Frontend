import { Checkbox } from "@/shared/ui/checkbox";
import { AppFormField } from "@/shared/ui/app-form";
import { Input } from "@/shared/ui/input";
import { useTranslation } from "react-i18next";
import type { ProductOption } from "@/entities/products/model/types";
import {
  InlineCreate,
  SelectField,
  SplitPaymentFields,
} from "@/features/products/sell-product/SellFormControls";

export function ShopBuyerFields({
  shopWalletId,
  setShopWalletId,
  shopOptions,
  newShopName,
  setNewShopName,
  onCreateShop,
}: {
  shopWalletId: string;
  setShopWalletId: (value: string) => void;
  shopOptions: ProductOption[];
  newShopName: string;
  setNewShopName: (value: string) => void;
  onCreateShop: () => void;
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
      />
      <InlineCreate
        value={newShopName}
        onChange={setNewShopName}
        onCreate={onCreateShop}
        placeholder={t("sell.newPartner")}
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
            <Input
              id="shop-prepayment"
              type="number"
              step="1"
              min="1"
              value={shopPrepaymentAmount}
              onChange={(event) => setShopPrepaymentAmount(event.target.value)}
              required
            />
          </AppFormField>
          <SelectField
            label={t("sell.creditPaymentTo")}
            value={shopPrepaymentWalletId}
            onValueChange={setShopPrepaymentWalletId}
            options={walletOptions}
            placeholder={t("sell.selectWallet")}
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
    </div>
  );
}
