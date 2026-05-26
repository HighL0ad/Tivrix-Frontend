import { Checkbox } from "@/shared/ui/checkbox";
import { AppFormField, AppRadioCards } from "@/shared/ui/app-form";
import { Input } from "@/shared/ui/input";
import { useTranslation } from "react-i18next";
import type { ProductOption } from "@/entities/products/model/types";
import {
  SelectField,
  SplitPaymentFields,
} from "@/features/products/sell-product/SellFormControls";

export function ClientPaymentFields({
  saleMode,
  setSaleMode,
  paymentWalletId,
  setPaymentWalletId,
  splitPaymentEnabled,
  setSplitPaymentEnabled,
  splitPaymentAmount,
  setSplitPaymentAmount,
  splitPaymentWalletId,
  setSplitPaymentWalletId,
  walletOptions,
}: {
  saleMode: "full_payment" | "partial_debt" | "installment";
  setSaleMode: (
    value: "full_payment" | "partial_debt" | "installment",
  ) => void;
  paymentWalletId: string;
  setPaymentWalletId: (value: string) => void;
  splitPaymentEnabled: boolean;
  setSplitPaymentEnabled: (value: boolean) => void;
  splitPaymentAmount: string;
  setSplitPaymentAmount: (value: string) => void;
  splitPaymentWalletId: string;
  setSplitPaymentWalletId: (value: string) => void;
  walletOptions: ProductOption[];
}) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <AppRadioCards
        value={saleMode}
        onValueChange={setSaleMode}
        options={[
          { value: "full_payment", label: t("sell.fullPayment") },
          { value: "partial_debt", label: t("sell.partialDebt") },
          { value: "installment", label: t("sell.installment") },
        ]}
      />

      <>
        <SelectField
          label={
            saleMode === "installment"
              ? t("sell.firstPaymentWallet")
              : t("sell.paymentWallet")
          }
          value={paymentWalletId}
          onValueChange={setPaymentWalletId}
          options={walletOptions}
          placeholder={t("sell.selectWallet")}
          className="h-11"
        />
        <SplitPaymentFields
          enabled={splitPaymentEnabled}
          setEnabled={setSplitPaymentEnabled}
          amount={splitPaymentAmount}
          setAmount={setSplitPaymentAmount}
          walletId={splitPaymentWalletId}
          setWalletId={setSplitPaymentWalletId}
          walletOptions={walletOptions.filter(
            (option) => option.id !== paymentWalletId,
          )}
          title={t("sell.splitPayment")}
        />
      </>
    </div>
  );
}

export function ClientDebtFields({
  saleMode,
  paidNowAmount,
  setPaidNowAmount,
  installmentTotalPrice,
  setInstallmentTotalPrice,
  installmentMonths,
  setInstallmentMonths,
  installmentPaymentDay,
  setInstallmentPaymentDay,
  clientSelected,
  registrationFeeAvailable,
  registrationFeeEnabled,
  setRegistrationFeeEnabled,
  registrationFeeAmount,
  setRegistrationFeeAmount,
}: {
  saleMode: "full_payment" | "partial_debt" | "installment";
  paidNowAmount: string;
  setPaidNowAmount: (value: string) => void;
  installmentTotalPrice: string;
  setInstallmentTotalPrice: (value: string) => void;
  installmentMonths: string;
  setInstallmentMonths: (value: string) => void;
  installmentPaymentDay: string;
  setInstallmentPaymentDay: (value: string) => void;
  clientSelected: boolean;
  registrationFeeAvailable: boolean;
  registrationFeeEnabled: boolean;
  setRegistrationFeeEnabled: (value: boolean) => void;
  registrationFeeAmount: string;
  setRegistrationFeeAmount: (value: string) => void;
}) {
  const { t } = useTranslation();

  if (saleMode === "full_payment" && !registrationFeeAvailable) {
    return null;
  }

  return (
    <div className="space-y-4">
      {saleMode === "installment" ? (
        <AppFormField
          label={t("sell.installmentTotalPrice")}
          helper={t("sell.installmentTotalPriceHelp")}
        >
          <div className="relative">
            <Input
              id="installment-total-price"
              type="number"
              step="1"
              min="0"
              value={installmentTotalPrice}
              onChange={(event) => setInstallmentTotalPrice(event.target.value)}
              className="h-11 pr-10 font-bold text-sky-700 border-sky-200 bg-sky-50/50 focus:bg-background transition-colors"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-sky-700/50 pointer-events-none">
              ₼
            </span>
          </div>
        </AppFormField>
      ) : null}

      {saleMode === "partial_debt" || saleMode === "installment" ? (
        <AppFormField
          label={
            saleMode === "installment"
              ? t("sell.firstPayment")
              : t("sell.paidNow")
          }
        >
          <div className="relative">
            <Input
              id="paid-now"
              type="number"
              step="1"
              min="0"
              value={paidNowAmount}
              onChange={(event) => setPaidNowAmount(event.target.value)}
              className="h-11 pr-10 font-bold text-amber-700 border-amber-200 bg-amber-50/50 focus:bg-background transition-colors"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-amber-700/50 pointer-events-none">
              ₼
            </span>
          </div>
        </AppFormField>
      ) : null}

      {saleMode === "installment" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <AppFormField label={t("sell.installmentMonths")}>
            <Input
              type="number"
              step="1"
              min="1"
              max="36"
              value={installmentMonths}
              onChange={(event) => setInstallmentMonths(event.target.value)}
              className="h-11 font-bold"
              required
            />
          </AppFormField>
          <AppFormField label={t("sell.installmentPaymentDay")}>
            <Input
              type="number"
              step="1"
              min="1"
              max="31"
              value={installmentPaymentDay}
              onChange={(event) => setInstallmentPaymentDay(event.target.value)}
              className="h-11 font-bold"
              required
            />
          </AppFormField>
        </div>
      ) : null}

      {saleMode !== "full_payment" && clientSelected ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
          {t("sell.debtAutoForBuyer")}
        </div>
      ) : null}



      {registrationFeeAvailable ? (
        <div className="mt-4 space-y-4 border-t border-border pt-4">
          <label className="flex cursor-pointer items-start gap-3">
            <Checkbox
              checked={registrationFeeEnabled}
              onCheckedChange={(checked) =>
                setRegistrationFeeEnabled(Boolean(checked))
              }
              className="mt-1 size-5"
            />
            <span>
              <span className="block text-[13px] font-bold leading-5 text-foreground">
                {t("sell.registrationSeparateDebt")}
              </span>
            </span>
          </label>
          {registrationFeeEnabled ? (
            <AppFormField label={t("sell.registrationAmount")}>
              <div className="relative">
                <Input
                  type="number"
                  step="1"
                  min="1"
                  value={registrationFeeAmount}
                  onChange={(event) => setRegistrationFeeAmount(event.target.value)}
                  className="h-11 pr-10 font-bold text-amber-700 border-amber-200 bg-amber-50/50 focus:bg-background transition-colors"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-amber-700/50 pointer-events-none">
                  ₼
                </span>
              </div>
            </AppFormField>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
