import { Checkbox } from "@/shared/ui/checkbox";
import { AppFormField, AppRadioCards } from "@/shared/ui/app-form";
import { Input } from "@/shared/ui/input";
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
  return (
    <div className="space-y-4">
      <AppRadioCards
        value={saleMode}
        onValueChange={setSaleMode}
        options={[
          { value: "full_payment", label: "Полная оплата" },
          { value: "partial_debt", label: "Частично в долг" },
          { value: "full_debt", label: "Полностью в долг" },
        ]}
      />

      {saleMode !== "full_debt" ? (
        <>
          <SelectField
            label="Куда поступила оплата"
            value={paymentWalletId}
            onValueChange={setPaymentWalletId}
            options={walletOptions}
            placeholder="Выберите кошелек"
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
            title="Разнести часть оплаты на второй кошелек"
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
  if (saleMode === "full_payment" && !registrationFeeAvailable) {
    return null;
  }

  return (
    <div className="space-y-4">
      {saleMode === "partial_debt" ? (
        <AppFormField label="Оплачено сейчас">
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
            label="На кого записать долг"
            value={clientDebtWalletId}
            onValueChange={setClientDebtWalletId}
            options={debtOptions}
            placeholder="Выберите клиента"
          />
          <InlineCreate
            value={newDebtName}
            onChange={setNewDebtName}
            onCreate={onCreateDebt}
            placeholder="Новый клиент"
          />
        </div>
      ) : null}

      {registrationFeeAvailable ? (
        <div className="space-y-3 rounded-lg border p-3">
          <label className="flex items-center gap-2 text-xs font-medium">
            <Checkbox
              checked={registrationFeeEnabled}
              onCheckedChange={(checked) =>
                setRegistrationFeeEnabled(Boolean(checked))
              }
            />
            Регистрация IMEI отдельным долгом
          </label>
          {registrationFeeEnabled ? (
            <AppFormField label="Сумма регистрации">
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
