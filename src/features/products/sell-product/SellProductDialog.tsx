import { type ComponentProps, type ReactNode, useState } from "react";
import { AlertCircle, Banknote, Store } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import {
  useProductSellOptions,
  useSellProduct,
} from "@/entities/products/api/use-product-sell";
import { useCreateDebtWallet } from "@/entities/debts/api/use-debts";
import type { ProductDetail, ProductSellPayload } from "@/entities/products/model/types";
import { getApiErrorMessage } from "@/shared/api/error";
import { ApiError } from "@/shared/api/http";
import { queryClient } from "@/shared/api/query-client";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import {
  AppFileUpload,
  AppFormField,
  AppSection,
  ResponsiveModal,
} from "@/shared/ui/app-form";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

import { ClientDebtFields, ClientPaymentFields } from "./ClientSaleFields";
import { DealSummary } from "./DealSummary";
import { buildSellFormData, getErrorMessage, toNumber, toOptionalNumber } from "./lib";
import { SelectField } from "./SellFormControls";
import { formatPhoneInput, formatNumberInput } from "@/shared/lib/input-formatters";
import { ShopBuyerFields, ShopPaymentFields } from "./ShopSaleFields";

type SellProductDialogProps = {
  product: ProductDetail;
  onSold: (product: ProductDetail) => void;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function SellProductDialog({
  product,
  onSold,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: SellProductDialogProps) {
  const { t } = useTranslation();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const optionsQuery = useProductSellOptions(product.id, open);
  const sellMutation = useSellProduct(product.id);
  const createWalletMutation = useCreateDebtWallet();
  const [saleType, setSaleType] = useState<"client" | "shop">("client");
  const [saleMode, setSaleMode] = useState<
    "full_payment" | "partial_debt" | "installment"
  >("full_payment");
  const [totalPrice, setTotalPrice] = useState("");
  const [paymentWalletId, setPaymentWalletId] = useState("");
  const [splitPaymentEnabled, setSplitPaymentEnabled] = useState(false);
  const [splitPaymentAmount, setSplitPaymentAmount] = useState("");
  const [splitPaymentWalletId, setSplitPaymentWalletId] = useState("");
  const [paidNowAmount, setPaidNowAmount] = useState("");
  const [installmentMonths, setInstallmentMonths] = useState("");
  const [installmentPaymentDay, setInstallmentPaymentDay] = useState("");
  const [clientDebtWalletId] = useState("");
  const [registrationFeeEnabled, setRegistrationFeeEnabled] = useState(false);
  const [registrationFeeAmount, setRegistrationFeeAmount] = useState("");
  const [shopWalletId, setShopWalletId] = useState("");
  const [shopPrepaymentEnabled, setShopPrepaymentEnabled] = useState(false);
  const [shopPrepaymentAmount, setShopPrepaymentAmount] = useState("");
  const [shopPrepaymentWalletId, setShopPrepaymentWalletId] = useState("");
  const [shopSplitPaymentEnabled, setShopSplitPaymentEnabled] = useState(false);
  const [shopSplitPaymentAmount, setShopSplitPaymentAmount] = useState("");
  const [shopSplitPaymentWalletId, setShopSplitPaymentWalletId] = useState("");
  const [shopDebtDueDate, setShopDebtDueDate] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [source, setSource] = useState("none");
  const [proofPhoto, setProofPhoto] = useState<File | null>(null);
  const [installmentTotalPrice, setInstallmentTotalPrice] = useState("");

  const error =
    sellMutation.error instanceof ApiError
      ? getErrorMessage(sellMutation.error.payload)
      : null;
  const finalContractPrice =
    saleType === "client" && saleMode === "installment"
      ? (installmentTotalPrice || totalPrice)
      : totalPrice;
  const paidNowTotal = saleMode === "full_payment" ? totalPrice : paidNowAmount;
  const registrationFee = registrationFeeEnabled
    ? toNumber(registrationFeeAmount)
    : 0;
  const shopDebt = Math.max(
    toNumber(totalPrice) -
      (shopPrepaymentEnabled ? toNumber(shopPrepaymentAmount) : 0),
    0,
  );
  const hasNewClientDraft = Boolean(clientName.trim() || clientPhone.trim());
  const netProfit = toNumber(totalPrice) - toNumber(product.buy_price) - registrationFee;
  const isSubmitDisabled =
    sellMutation.isPending ||
    optionsQuery.isLoading ||
    (saleType === "shop" && shopDebt > 0 && !shopDebtDueDate);

  const handleSubmit: NonNullable<ComponentProps<"form">["onSubmit"]> = (
    event,
  ) => {
    event.preventDefault();

    // When partial debt is selected with 0 upfront -> treat as full_debt for backend
    const effectiveSaleMode: ProductSellPayload["sale_mode"] =
      saleMode === "partial_debt" && !paidNowAmount
        ? "full_debt"
        : saleMode;

    const finalTotalPrice =
      saleType === "client" && effectiveSaleMode === "installment"
        ? (installmentTotalPrice || totalPrice)
        : totalPrice;

    const payload: ProductSellPayload = {
      sale_type: saleType,
      sale_mode: saleType === "shop" ? "full_payment" : effectiveSaleMode,
      total_price: finalTotalPrice.replace(/\s/g, ""),
      source,
    };

    if (saleType === "client") {
      payload.client_id = toOptionalNumber(clientId);
      if (!clientId) {
        payload.client_name = clientName || undefined;
        payload.client_phone = clientPhone || undefined;
      }
      if (effectiveSaleMode !== "full_debt") {
        payload.payment_wallet_id = toOptionalNumber(paymentWalletId);
      }
      if (effectiveSaleMode !== "full_debt" && splitPaymentEnabled) {
        payload.split_payment_enabled = true;
        payload.split_payment_amount = splitPaymentAmount.replace(/\s/g, "");
        payload.split_payment_wallet_id = toOptionalNumber(splitPaymentWalletId);
      }
      if ((saleMode === "partial_debt" || saleMode === "installment") && paidNowAmount) {
        payload.paid_now_amount = paidNowAmount.replace(/\s/g, "");
      }
      if (effectiveSaleMode === "installment") {
        payload.installment_months = toOptionalNumber(installmentMonths);
        payload.installment_payment_day = toOptionalNumber(installmentPaymentDay);
        payload.cash_price = totalPrice ? totalPrice.replace(/\s/g, "") : undefined;
      }
      if (effectiveSaleMode !== "full_payment") {
        payload.client_debt_wallet_id = toOptionalNumber(clientDebtWalletId);
      }
      if (registrationFeeEnabled) {
        payload.registration_fee_enabled = true;
        payload.registration_fee_amount = registrationFeeAmount.replace(/\s/g, "");
      }
    } else {
      payload.shop_wallet_id = toOptionalNumber(shopWalletId);
      payload.shop_prepayment_enabled = shopPrepaymentEnabled;
      if (shopPrepaymentEnabled) {
        payload.shop_prepayment_amount = shopPrepaymentAmount.replace(/\s/g, "");
        payload.shop_prepayment_wallet_id = toOptionalNumber(
          shopPrepaymentWalletId,
        );
        if (shopSplitPaymentEnabled) {
          payload.shop_split_payment_enabled = true;
          payload.shop_split_payment_amount = shopSplitPaymentAmount.replace(/\s/g, "");
          payload.shop_split_payment_wallet_id = toOptionalNumber(
            shopSplitPaymentWalletId,
          );
        }
      }
      if (shopDebt > 0) {
        payload.shop_debt_due_date = shopDebtDueDate;
      }
    }

    sellMutation.mutate(proofPhoto ? buildSellFormData(payload, proofPhoto) : payload, {
      onSuccess: (soldProduct) => {
        queryClient.invalidateQueries({
          queryKey: ["products", product.id],
          exact: true,
        });
        queryClient.invalidateQueries({
          predicate: (query) =>
            query.queryKey[0] === "products" &&
            typeof query.queryKey[1] === "object",
        });
        queryClient.invalidateQueries({
          queryKey: ["products", product.id, "sell-options"],
        });
        queryClient.invalidateQueries({ queryKey: ["clients"] });
        queryClient.invalidateQueries({ queryKey: ["debts"] });
        queryClient.invalidateQueries({ queryKey: ["finance"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        onSold(soldProduct);
        setOpen(false);
        toast.success(t("sell.completed"));
      },
      onError: (error) => toast.error(getApiErrorMessage(error)),
    });
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={setOpen}
      trigger={trigger ?? <Button type="button">{t("sell.trigger")}</Button>}
      title={t("sell.title")}
      description={t("sell.description")}
      className="md:max-w-2xl"
      footer={
        <div className="grid w-full gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
          <DealSummary
            saleType={saleType}
            totalPrice={finalContractPrice}
            paidNowTotal={paidNowTotal}
            shopDebt={shopDebt}
            registrationFee={registrationFee}
            netProfit={netProfit}
          />
          <Button
            type="submit"
            form="sell-product-form"
            disabled={isSubmitDisabled}
            className="w-full sm:w-auto"
          >
            {sellMutation.isPending ? t("sell.completing") : t("sell.complete")}
          </Button>
        </div>
      }
    >
        <form id="sell-product-form" onSubmit={handleSubmit} className="space-y-6">
          {error ? (
            <Alert variant="destructive">
              <AlertCircle aria-hidden="true" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <AppSection title={t("sell.product")}>
            <div className="rounded-lg border bg-muted/40 p-3">
              <div className="font-bold">{product.name}</div>
              <div className="mt-2 grid grid-cols-2 gap-3 text-[13px] leading-5 text-gray-500">
                <span>{t("sell.purchase")}: {product.buy_price} ₼</span>
                <span className="font-mono">IMEI: {product.imei}</span>
              </div>
            </div>
          </AppSection>

          <AppSection title={t("sell.buyer")}>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={saleType === "client" ? "default" : "outline"}
                onClick={() => {
                  setSaleType("client");
                  setSaleMode("full_payment");
                }}
              >
                <Banknote aria-hidden="true" />
                {t("sell.client")}
              </Button>
              <Button
                type="button"
                variant={saleType === "shop" ? "default" : "outline"}
                onClick={() => setSaleType("shop")}
              >
                <Store aria-hidden="true" />
                {t("sell.shop")}
              </Button>
            </div>

            {saleType === "shop" ? (
              <ShopBuyerFields
                shopWalletId={shopWalletId}
                setShopWalletId={setShopWalletId}
                shopOptions={optionsQuery.data?.sale_shop_partner_options ?? []}
                onCreateShop={(query) => {
                  const name = query.trim();
                  if (!name) return;
                  createWalletMutation.mutate(
                    { name, wallet_type: "shop" },
                    {
                      onSuccess: (wallet) => {
                        setShopWalletId(String(wallet.id));
                        optionsQuery.refetch();
                        toast.success(t("sell.shopCreated"));
                      },
                      onError: (error) => toast.error(getApiErrorMessage(error)),
                    },
                  );
                }}
              />
            ) : null}

          {saleType === "client" ? (
            <>
              <SelectField
                label={t("sell.existingBuyer")}
                value={clientId}
                onValueChange={(value) => {
                  setClientId(value);
                  if (value) {
                    setClientName("");
                    setClientPhone("");
                  }
                }}
                options={optionsQuery.data?.sale_client_options ?? []}
                placeholder={t("sell.selectClient")}
                className="h-11"
                disabled={hasNewClientDraft}
                clearable
              />

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground">
                  <span className="h-px flex-1 bg-border" />
                  <span>{t("sell.orNewBuyer")}</span>
                  <span className="h-px flex-1 bg-border" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <AppFormField label={t("sell.newBuyerName")}>
                    <Input
                      id="client-name"
                      value={clientName}
                      onChange={(event) => setClientName(event.target.value)}
                      placeholder={t("sell.newBuyerNamePlaceholder")}
                      disabled={Boolean(clientId)}
                    />
                  </AppFormField>
                  <AppFormField label={t("sell.newBuyerPhone")}>
                    <Input
                      id="client-phone"
                      type="tel"
                      value={clientPhone}
                      onChange={(event) => setClientPhone(formatPhoneInput(event.target.value))}
                      placeholder={t("sell.newBuyerPhonePlaceholder")}
                      disabled={Boolean(clientId)}
                    />
                  </AppFormField>
                </div>
              </div>

              <SelectField
                label={t("sell.customerSource")}
                value={source}
                onValueChange={setSource}
                options={optionsQuery.data?.sale_source_options ?? []}
                placeholder={t("products.notSpecified")}
                className="h-11"
              />
            </>
          ) : null}
          </AppSection>

          <AppSection
            title={t("sell.payment")}
            description={saleType === "client" ? t("sell.paymentQuestion") : undefined}
          >
            <AppFormField
              label={t("sell.totalPrice")}
              helper={t("sell.totalPriceHelper", {
                buyPrice: product.buy_price,
                profit: netProfit.toFixed(2),
              })}
            >
              <div className="relative">
                <Input
                  id="total-price"
                  type="text"
                  inputMode="decimal"
                  value={totalPrice}
                  onChange={(event) => setTotalPrice(formatNumberInput(event.target.value))}
                  className="h-11 pr-10 font-bold text-sky-700 border-sky-200 bg-sky-50/50 focus:bg-background transition-colors"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-sky-700/50 pointer-events-none">
                  ₼
                </span>
              </div>
            </AppFormField>
            {saleType === "client" ? (
              <ClientPaymentFields
                saleMode={saleMode}
                setSaleMode={setSaleMode}
                paymentWalletId={paymentWalletId}
                setPaymentWalletId={setPaymentWalletId}
                splitPaymentEnabled={splitPaymentEnabled}
                setSplitPaymentEnabled={setSplitPaymentEnabled}
                splitPaymentAmount={splitPaymentAmount}
                setSplitPaymentAmount={setSplitPaymentAmount}
                splitPaymentWalletId={splitPaymentWalletId}
                setSplitPaymentWalletId={setSplitPaymentWalletId}
                walletOptions={optionsQuery.data?.sale_wallet_options ?? []}
              />
            ) : (
              <ShopPaymentFields
                shopPrepaymentEnabled={shopPrepaymentEnabled}
                setShopPrepaymentEnabled={setShopPrepaymentEnabled}
                shopPrepaymentAmount={shopPrepaymentAmount}
                setShopPrepaymentAmount={setShopPrepaymentAmount}
                shopPrepaymentWalletId={shopPrepaymentWalletId}
                setShopPrepaymentWalletId={setShopPrepaymentWalletId}
                shopSplitPaymentEnabled={shopSplitPaymentEnabled}
                setShopSplitPaymentEnabled={setShopSplitPaymentEnabled}
                shopSplitPaymentAmount={shopSplitPaymentAmount}
                setShopSplitPaymentAmount={setShopSplitPaymentAmount}
                shopSplitPaymentWalletId={shopSplitPaymentWalletId}
                setShopSplitPaymentWalletId={setShopSplitPaymentWalletId}
                shopDebtDueDate={shopDebtDueDate}
                setShopDebtDueDate={setShopDebtDueDate}
                shopDebt={shopDebt}
                walletOptions={optionsQuery.data?.sale_wallet_options ?? []}
              />
            )}
          </AppSection>

          <AppSection title={t("sell.debt")}>
            {saleType === "client" ? (
              <ClientDebtFields
                saleMode={saleMode}
                paidNowAmount={paidNowAmount}
                setPaidNowAmount={setPaidNowAmount}
                installmentTotalPrice={installmentTotalPrice}
                setInstallmentTotalPrice={setInstallmentTotalPrice}
                installmentMonths={installmentMonths}
                setInstallmentMonths={setInstallmentMonths}
                installmentPaymentDay={installmentPaymentDay}
                setInstallmentPaymentDay={setInstallmentPaymentDay}
                clientSelected={Boolean(clientId || clientDebtWalletId || clientName.trim())}
                registrationFeeAvailable={
                  optionsQuery.data?.registration_fee_available ?? false
                }
                registrationFeeEnabled={registrationFeeEnabled}
                setRegistrationFeeEnabled={setRegistrationFeeEnabled}
                registrationFeeAmount={registrationFeeAmount}
                setRegistrationFeeAmount={setRegistrationFeeAmount}
              />
            ) : (
              <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
                {t("sell.shopDebtAuto")}
                {shopDebt > 0 && shopDebtDueDate ? (
                  <span className="mt-1 block font-medium text-foreground">
                    {t("sell.shopDebtDueDate")}: {shopDebtDueDate}
                  </span>
                ) : null}
              </div>
            )}
          </AppSection>

          <AppSection title={t("sell.confirmation")}>
            <AppFileUpload
              value={proofPhoto}
              onChange={(file) => setProofPhoto(file instanceof File ? file : null)}
              accept="image/*"
              label={t("sell.uploadProof")}
            />
          </AppSection>
        </form>
    </ResponsiveModal>
  );
}
