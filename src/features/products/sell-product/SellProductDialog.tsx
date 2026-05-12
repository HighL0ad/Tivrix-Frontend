import { type ComponentProps, type ReactNode, useState } from "react";
import { AlertCircle, Banknote, Store } from "lucide-react";
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
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const optionsQuery = useProductSellOptions(product.id, open);
  const sellMutation = useSellProduct(product.id);
  const createWalletMutation = useCreateDebtWallet();
  const [saleType, setSaleType] = useState<"client" | "shop">("client");
  const [saleMode, setSaleMode] = useState<
    "full_payment" | "partial_debt" | "full_debt"
  >("full_payment");
  const [totalPrice, setTotalPrice] = useState("");
  const [paymentWalletId, setPaymentWalletId] = useState("");
  const [splitPaymentEnabled, setSplitPaymentEnabled] = useState(false);
  const [splitPaymentAmount, setSplitPaymentAmount] = useState("");
  const [splitPaymentWalletId, setSplitPaymentWalletId] = useState("");
  const [paidNowAmount, setPaidNowAmount] = useState("");
  const [clientDebtWalletId, setClientDebtWalletId] = useState("");
  const [registrationFeeEnabled, setRegistrationFeeEnabled] = useState(false);
  const [registrationFeeAmount, setRegistrationFeeAmount] = useState("");
  const [shopWalletId, setShopWalletId] = useState("");
  const [shopPrepaymentEnabled, setShopPrepaymentEnabled] = useState(false);
  const [shopPrepaymentAmount, setShopPrepaymentAmount] = useState("");
  const [shopPrepaymentWalletId, setShopPrepaymentWalletId] = useState("");
  const [shopSplitPaymentEnabled, setShopSplitPaymentEnabled] = useState(false);
  const [shopSplitPaymentAmount, setShopSplitPaymentAmount] = useState("");
  const [shopSplitPaymentWalletId, setShopSplitPaymentWalletId] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [source, setSource] = useState("none");
  const [proofPhoto, setProofPhoto] = useState<File | null>(null);
  const [newDebtName, setNewDebtName] = useState("");
  const [newShopName, setNewShopName] = useState("");

  const error =
    sellMutation.error instanceof ApiError
      ? getErrorMessage(sellMutation.error.payload)
      : null;
  const paidNowTotal = saleMode === "full_payment" ? totalPrice : paidNowAmount;
  const registrationFee = registrationFeeEnabled
    ? toNumber(registrationFeeAmount)
    : 0;
  const shopDebt = Math.max(
    toNumber(totalPrice) -
      (shopPrepaymentEnabled ? toNumber(shopPrepaymentAmount) : 0),
    0,
  );
  const netProfit = toNumber(totalPrice) - toNumber(product.buy_price) - registrationFee;
  const isSubmitDisabled = sellMutation.isPending || optionsQuery.isLoading;

  const handleSubmit: NonNullable<ComponentProps<"form">["onSubmit"]> = (
    event,
  ) => {
    event.preventDefault();

    const payload: ProductSellPayload = {
      sale_type: saleType,
      sale_mode: saleType === "shop" ? "full_payment" : saleMode,
      total_price: totalPrice,
      client_name: clientName || undefined,
      client_phone: clientPhone || undefined,
      source,
    };

    if (saleType === "client") {
      if (saleMode !== "full_debt") {
        payload.payment_wallet_id = toOptionalNumber(paymentWalletId);
      }
      if (saleMode !== "full_debt" && splitPaymentEnabled) {
        payload.split_payment_enabled = true;
        payload.split_payment_amount = splitPaymentAmount;
        payload.split_payment_wallet_id = toOptionalNumber(splitPaymentWalletId);
      }
      if (saleMode === "partial_debt") {
        payload.paid_now_amount = paidNowAmount;
      }
      if (saleMode !== "full_payment") {
        payload.client_debt_wallet_id = toOptionalNumber(clientDebtWalletId);
      }
      if (registrationFeeEnabled) {
        payload.registration_fee_enabled = true;
        payload.registration_fee_amount = registrationFeeAmount;
      }
    } else {
      payload.shop_wallet_id = toOptionalNumber(shopWalletId);
      payload.shop_prepayment_enabled = shopPrepaymentEnabled;
      if (shopPrepaymentEnabled) {
        payload.shop_prepayment_amount = shopPrepaymentAmount;
        payload.shop_prepayment_wallet_id = toOptionalNumber(
          shopPrepaymentWalletId,
        );
        if (shopSplitPaymentEnabled) {
          payload.shop_split_payment_enabled = true;
          payload.shop_split_payment_amount = shopSplitPaymentAmount;
          payload.shop_split_payment_wallet_id = toOptionalNumber(
            shopSplitPaymentWalletId,
          );
        }
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
        onSold(soldProduct);
        setOpen(false);
        toast.success("Продажа оформлена");
      },
      onError: (error) => toast.error(getApiErrorMessage(error)),
    });
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={setOpen}
      trigger={trigger ?? <Button type="button">Продать товар</Button>}
      title="Оформление продажи"
      description="Оплата и долг будут разнесены автоматически."
      className="md:max-w-2xl"
      footer={
        <div className="grid w-full gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
          <DealSummary
            saleType={saleType}
            totalPrice={totalPrice}
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
            {sellMutation.isPending ? "Завершаем..." : "Завершить продажу"}
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

          <AppSection title="Товар">
            <div className="rounded-lg border bg-muted/40 p-3">
              <div className="font-bold">{product.name}</div>
              <div className="mt-2 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                <span>Закупка: {product.buy_price} ₼</span>
                <span className="font-mono">IMEI: {product.imei}</span>
              </div>
            </div>
          </AppSection>

          <AppSection title="Покупатель">
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
                Клиент
              </Button>
              <Button
                type="button"
                variant={saleType === "shop" ? "default" : "outline"}
                onClick={() => setSaleType("shop")}
              >
                <Store aria-hidden="true" />
                Магазин
              </Button>
            </div>

            {saleType === "shop" ? (
              <ShopBuyerFields
                shopWalletId={shopWalletId}
                setShopWalletId={setShopWalletId}
                shopOptions={optionsQuery.data?.sale_shop_partner_options ?? []}
                newShopName={newShopName}
                setNewShopName={setNewShopName}
                onCreateShop={() => {
                  const name = newShopName.trim();
                  if (!name) return;
                  createWalletMutation.mutate(
                    { name, wallet_type: "partner_shop" },
                    {
                      onSuccess: (wallet) => {
                        setShopWalletId(String(wallet.id));
                        setNewShopName("");
                        optionsQuery.refetch();
                        toast.success("Магазин создан");
                      },
                      onError: (error) => toast.error(getApiErrorMessage(error)),
                    },
                  );
                }}
              />
            ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <AppFormField label="Покупатель / контакт">
              <Input
                id="client-name"
                value={clientName}
                onChange={(event) => setClientName(event.target.value)}
                placeholder="Имя клиента или магазина"
              />
            </AppFormField>
            <AppFormField label="Телефон">
              <Input
                id="client-phone"
                value={clientPhone}
                onChange={(event) => setClientPhone(event.target.value)}
              />
            </AppFormField>
          </div>

          <SelectField
            label="Источник клиента"
            value={source}
            onValueChange={setSource}
            options={optionsQuery.data?.sale_source_options ?? []}
            placeholder="Не указано"
          />
          </AppSection>

          <AppSection title="Оплата" description="Как прошла оплата?">
            <AppFormField
              label="Итоговая цена продажи"
              helper={`Закупка: ${product.buy_price} ₼. Чистыми: ${netProfit.toFixed(2)} ₼`}
            >
              <Input
                id="total-price"
                type="number"
                min="0"
                step="1"
                value={totalPrice}
                onChange={(event) => setTotalPrice(event.target.value)}
                required
              />
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
                walletOptions={optionsQuery.data?.sale_wallet_options ?? []}
              />
            )}
          </AppSection>

          <AppSection title="Долг">
            {saleType === "client" ? (
              <ClientDebtFields
                saleMode={saleMode}
                paidNowAmount={paidNowAmount}
                setPaidNowAmount={setPaidNowAmount}
                clientDebtWalletId={clientDebtWalletId}
                setClientDebtWalletId={setClientDebtWalletId}
                debtOptions={optionsQuery.data?.sale_client_debt_options ?? []}
                newDebtName={newDebtName}
                setNewDebtName={setNewDebtName}
                onCreateDebt={() => {
                  const name = newDebtName.trim();
                  if (!name) return;
                  createWalletMutation.mutate(
                    { name, wallet_type: "client_debt" },
                    {
                      onSuccess: (wallet) => {
                        setClientDebtWalletId(String(wallet.id));
                        setNewDebtName("");
                        optionsQuery.refetch();
                        toast.success("Клиент создан");
                      },
                      onError: (error) => toast.error(getApiErrorMessage(error)),
                    },
                  );
                }}
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
                Долг магазина будет рассчитан автоматически от итоговой цены и оплаты сейчас.
              </div>
            )}
          </AppSection>

          <AppSection title="Подтверждение">
            <AppFileUpload
              value={proofPhoto}
              onChange={(file) => setProofPhoto(file instanceof File ? file : null)}
              accept="image/*"
              label="Загрузить фото подтверждения"
            />
          </AppSection>
        </form>
    </ResponsiveModal>
  );
}
