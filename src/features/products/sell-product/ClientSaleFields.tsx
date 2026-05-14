import { Checkbox } from "@/shared/ui/checkbox";
import { AppFormField, AppRadioCards } from "@/shared/ui/app-form";
import { Input } from "@/shared/ui/input";
import { useTranslation } from "react-i18next";
import type { ProductOption } from "@/entities/products/model/types";
import {
  InlineCreate,
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
  saleMode: "full_payment" | "partial_debt" | "full_debt";
  setSaleMode: (value: "full_payment" | "partial_debt" | "full_debt") => void;
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
          { value: "full_debt", label: t("sell.fullDebt") },
        ]}
      />

      {saleMode !== "full_debt" ? (
        <>
          <SelectField
            label={t("sell.paymentWallet")}
            value={paymentWalletId}
            onValueChange={setPaymentWalletId}
            options={walletOptions}
            placeholder={t("sell.selectWallet")}
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
      ) : null}
    </div>
  );
}

export function ClientDebtFields({
  saleMode,
  paidNowAmount,
  setPaidNowAmount,
  clientDebtWalletId,
  setClientDebtWalletId,
  debtOptions,
  newDebtName,
  setNewDebtName,
  onCreateDebt,
  registrationFeeAvailable,
  registrationFeeEnabled,
  setRegistrationFeeEnabled,
  registrationFeeAmount,
  setRegistrationFeeAmount,
}: {
  saleMode: "full_payment" | "partial_debt" | "full_debt";
  paidNowAmount: string;
  setPaidNowAmount: (value: string) => void;
  clientDebtWalletId: string;
  setClientDebtWalletId: (value: string) => void;
  debtOptions: ProductOption[];
  newDebtName: string;
  setNewDebtName: (value: string) => void;
  onCreateDebt: () => void;
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
      {saleMode === "partial_debt" ? (
        <AppFormField label={t("sell.paidNow")}>
          <Input
            id="paid-now"
            type="number"
            step="1"
            min="1"
            value={paidNowAmount}
            onChange={(event) => setPaidNowAmount(event.target.value)}
            required
          />
        </AppFormField>
      ) : null}

      {saleMode !== "full_payment" ? (
        <div className="space-y-2">
          <SelectField
            label={t("sell.debtWallet")}
            value={clientDebtWalletId}
            onValueChange={setClientDebtWalletId}
            options={debtOptions}
            placeholder={t("sell.selectClient")}
          />
          <InlineCreate
            value={newDebtName}
            onChange={setNewDebtName}
            onCreate={onCreateDebt}
            placeholder={t("sell.newClient")}
          />
        </div>
      ) : null}

      {registrationFeeAvailable ? (
        <div className="space-y-3 rounded-lg border p-3">
          <label className="flex items-center gap-2 text-[13px] font-medium leading-5 text-foreground">
            <Checkbox
              checked={registrationFeeEnabled}
              onCheckedChange={(checked) =>
                setRegistrationFeeEnabled(Boolean(checked))
              }
            />
            {t("sell.registrationSeparateDebt")}
          </label>
          {registrationFeeEnabled ? (
            <AppFormField label={t("sell.registrationAmount")}>
              <Input
                type="number"
                step="1"
                min="1"
                value={registrationFeeAmount}
                onChange={(event) => setRegistrationFeeAmount(event.target.value)}
                required
              />
            </AppFormField>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
