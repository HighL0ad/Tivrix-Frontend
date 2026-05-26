import {
  type ComponentProps,
  useMemo,
  useState,
} from "react";
import { AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router";
import { toast } from "sonner";

import {
  checkProductImei,
  useCreateProduct,
  useProductCreateOptions,
} from "@/entities/products/api/use-product-create";
import { useCreateWallet } from "@/entities/catalogs/api/use-catalogs";
import { getApiErrorMessage } from "@/shared/api/error";
import { ApiError } from "@/shared/api/http";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { AppFileUpload } from "@/shared/ui/app-form";
import { BackActionButton } from "@/shared/ui/back-button";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Checkbox } from "@/shared/ui/checkbox";
import { Input } from "@/shared/ui/input";
import { PageHeader } from "@/shared/ui/page-header";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group";
import { SearchableSelect } from "@/shared/ui/searchable-select";
import {
  Field,
  InfoBox,
  RegistrationCheckboxGroup,
  SummaryRow,
} from "@/features/products/product-form/FormPrimitives";
import {
  getPaymentMethod,
  getProductFormErrorMessage,
  type PurchaseScenario,
  scenarioMeta,
} from "@/features/products/product-form/model";
import type { WalletType } from "@/entities/finance/api/use-finance";

export function ProductCreatePage() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const optionsQuery = useProductCreateOptions();
  const createMutation = useCreateProduct();
  const createWalletMutation = useCreateWallet();

  const [scenario, setScenario] = useState<PurchaseScenario>("supplier_debt");
  const [name, setName] = useState("");
  const [imei, setImei] = useState("");
  const [imei2, setImei2] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [paymentWalletId, setPaymentWalletId] = useState("");
  const [paidNowEnabled, setPaidNowEnabled] = useState(false);
  const [paidNowAmount, setPaidNowAmount] = useState("");
  const [splitEnabled, setSplitEnabled] = useState(false);
  const [primarySplitAmount, setPrimarySplitAmount] = useState("");
  const [splitWalletId, setSplitWalletId] = useState("");
  const [registrationStatuses, setRegistrationStatuses] = useState<string[]>(
    [],
  );
  const [photos, setPhotos] = useState<File[]>([]);
  const [imeiError, setImeiError] = useState("");
  const [checkingImei, setCheckingImei] = useState(false);

  const options = optionsQuery.data;
  const buyPriceNumber = Number(buyPrice || 0);
  const paidNowNumber = Number(paidNowAmount || 0);
  const primarySplitNumber = Number(primarySplitAmount || 0);
  const splitTotalAmount =
    scenario === "supplier_debt" && paidNowEnabled ? paidNowNumber : buyPriceNumber;
  const secondarySplitAmount = splitEnabled
    ? Math.max(splitTotalAmount - primarySplitNumber, 0)
    : 0;
  const partialDebtAmount =
    scenario === "supplier_debt" && paidNowEnabled
      ? Math.max(buyPriceNumber - paidNowNumber, 0)
      : buyPriceNumber;
  const splitAmountInvalid =
    splitEnabled &&
    (primarySplitNumber <= 0 || primarySplitNumber >= splitTotalAmount);
  const paidNowAmountInvalid =
    scenario === "supplier_debt" &&
    paidNowEnabled &&
    (paidNowNumber <= 0 || paidNowNumber >= buyPriceNumber);

  const visibleSplitWalletOptions = useMemo(() => {
    const allOptions = options?.split_wallet_options ?? [];
    return allOptions.filter((option) => {
      if (scenario === "cash_now" && option.type === "cash") return false;
      if (scenario === "cash_now" && option.id === options?.cash_wallet_id)
        return false;
      if (scenario === "transfer_now" && option.id === paymentWalletId)
        return false;
      if (scenario === "supplier_debt" && paidNowEnabled && option.id === paymentWalletId)
        return false;
      return true;
    });
  }, [options, paidNowEnabled, paymentWalletId, scenario]);

  const productsHref = (location.state as { from?: string } | null)?.from ?? "/products";

  function handleScenarioChange(value: string) {
    const next = value as PurchaseScenario;
    setScenario(next);
    if (next !== "transfer_now" && next !== "supplier_debt") {
      setPaymentWalletId("");
    }
    if (next === "supplier_debt") {
      setSplitEnabled(false);
      setSplitWalletId("");
      setPrimarySplitAmount("");
    }
    if (next !== "supplier_debt") {
      setPaidNowEnabled(false);
      setPaidNowAmount("");
      setPrimarySplitAmount("");
    }
  }

  async function handleImeiBlur() {
    const normalizedImei = imei.trim();
    setImeiError("");
    if (!normalizedImei) return;
    setCheckingImei(true);
    try {
      const result = await checkProductImei(normalizedImei);
      if (result.exists) setImeiError(t("products.imeiExists"));
    } finally {
      setCheckingImei(false);
    }
  }

  function isFormValid() {
    return (
      !imeiError &&
      !splitAmountInvalid &&
      !paidNowAmountInvalid &&
      !!supplierId &&
      (scenario !== "transfer_now" || !!paymentWalletId) &&
      (scenario !== "supplier_debt" || !paidNowEnabled || !!paymentWalletId) &&
      (!splitEnabled || !!splitWalletId)
    );
  }

  const handleSubmit: NonNullable<ComponentProps<"form">["onSubmit"]> = (
    event,
  ) => {
    event.preventDefault();
    if (!isFormValid()) return;

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("imei", imei.trim());
    formData.append("buy_price", buyPrice);
    formData.append("supplier_id", supplierId);
    formData.append(
      "payment_method",
      scenario === "supplier_debt" && paidNowEnabled
        ? "partial_debt"
        : getPaymentMethod(scenario),
    );

    if (imei2.trim()) formData.append("imei2", imei2.trim());
    if (phoneNumber.trim()) formData.append("phone_number", phoneNumber.trim());
    if (scenario === "transfer_now" || (scenario === "supplier_debt" && paidNowEnabled))
      formData.append("wallet_id", paymentWalletId);
    if (scenario === "supplier_debt" && paidNowEnabled)
      formData.append("paid_now_amount", paidNowAmount);

    if (splitEnabled) {
      formData.append("split_payment_enabled", "on");
      formData.append("split_payment_amount", secondarySplitAmount.toFixed(2));
      formData.append("split_payment_wallet_id", splitWalletId);
    }

    registrationStatuses.forEach((status) => formData.append("status", status));
    photos.forEach((photo) => formData.append("photos", photo));

    createMutation.mutate(formData, {
      onSuccess: (product) => {
        toast.success(t("products.created"));
        navigate(`/products/${product.id}`, { replace: true });
      },
      onError: (error) =>
        toast.error(getApiErrorMessage(error, t("products.createPurchaseError"))),
    });
  };

  const error =
    createMutation.error instanceof ApiError
      ? getProductFormErrorMessage(
          createMutation.error.payload,
          t("products.createPurchaseTryAgain"),
        )
      : null;

  function createInlineWallet(
    name: string,
    walletType: WalletType,
    onCreated: (id: string) => void,
  ) {
    const trimmed = name.trim();
    if (!trimmed) return;
    createWalletMutation.mutate(
      { name: trimmed, wallet_type: walletType },
      {
        onSuccess: (wallet) => {
          onCreated(String(wallet.id));
          optionsQuery.refetch();
          toast.success(t("catalogs.walletCreated"));
        },
        onError: (error) => toast.error(getApiErrorMessage(error)),
      },
    );
  }

  if (optionsQuery.isLoading) {
    return (
      <Card className="mx-auto max-w-3xl">
        <CardContent className="p-8 text-sm text-muted-foreground">
          {t("products.loadingPurchaseForm")}
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="mx-auto max-w-6xl space-y-5">
      <PageHeader
        title={t("products.newPurchase")}
        description={t("products.newPurchaseDescription")}
        backButton={
          <BackActionButton onClick={() => navigate(productsHref)} />
        }
      />

      <form
        onSubmit={handleSubmit}
        className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]"
      >
        <div className="space-y-4">
          {error ? (
            <Alert className="rounded-lg border-red-200 bg-red-50 px-4 py-3 text-red-700">
              <AlertCircle aria-hidden="true" />
              <AlertDescription className="font-semibold text-red-700">
                {error}
              </AlertDescription>
            </Alert>
          ) : null}

          {/* Scenario */}
          <Card>
            <CardHeader>
              <CardTitle>{t("sell.paymentQuestion")}</CardTitle>
              <CardDescription>
                {t("products.paymentScenarioDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={scenario}
                onValueChange={handleScenarioChange}
                className="grid grid-cols-1 gap-3 md:grid-cols-3"
              >
                {(Object.keys(scenarioMeta) as PurchaseScenario[]).map(
                  (value) => {
                    const meta = scenarioMeta[value];
                    const selected = scenario === value;
                    return (
                      <label
                        key={value}
                        className={`flex cursor-pointer gap-3 rounded-lg border p-4 transition-all ${
                          selected
                            ? "border-primary bg-sky-50 ring-2 ring-primary/10"
                            : "border-border bg-background hover:border-muted-foreground/40"
                        }`}
                      >
                        <RadioGroupItem value={value} className="mt-0.5" />
                        <span>
                          <span className="block text-[13px] font-bold leading-5 text-foreground">
                            {t(meta.titleKey)}
                          </span>
                          <span className="mt-1 block text-[13px] leading-5 text-gray-500">
                            {t(meta.descriptionKey)}
                          </span>
                        </span>
                      </label>
                    );
                  },
                )}
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Product */}
          <Card>
            <CardHeader>
              <CardTitle>{t("sell.product")}</CardTitle>
              <CardDescription>{t("products.mainDataDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label={t("products.nameModel")}>
                <Input
                  required
                  placeholder="iPhone 13..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label={t("products.imeiSerial")}>
                  <Input
                    required
                    placeholder="35..."
                    className={`font-mono ${
                      imeiError
                        ? "border-red-300 bg-red-50 focus-visible:ring-red-500/20"
                        : ""
                    }`}
                    value={imei}
                    onChange={(e) => setImei(e.target.value)}
                    onBlur={handleImeiBlur}
                  />
                  {imeiError ? (
                    <p className="mt-1 text-xs font-semibold text-red-600">
                      {imeiError}
                    </p>
                  ) : checkingImei ? (
                    <p className="mt-1 text-[13px] font-medium leading-5 text-gray-500">
                      {t("products.checkingImei")}
                    </p>
                  ) : null}
                </Field>

                <Field label="IMEI 2">
                  <Input
                    placeholder={t("common.optional")}
                    className="font-mono"
                    value={imei2}
                    onChange={(e) => setImei2(e.target.value)}
                  />
                </Field>

                <Field label={t("products.phoneNumber")}>
                  <Input
                    type="tel"
                    placeholder="+994..."
                    className="font-mono"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </Field>

                <Field label={t("products.buyPriceAzn")}>
                  <Input
                    required
                    type="number"
                    step="1"
                    min="1"
                    placeholder="0"
                    className="font-bold"
                    value={buyPrice}
                    onChange={(e) => setBuyPrice(e.target.value)}
                  />
                </Field>
              </div>
            </CardContent>
          </Card>

          {/* Registration */}
          <Card>
            <CardHeader>
              <CardTitle>{t("products.registration")}</CardTitle>
              <CardDescription>
                {t("products.registrationDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RegistrationCheckboxGroup
                value={registrationStatuses}
                onChange={setRegistrationStatuses}
              />
            </CardContent>
          </Card>

          {/* Photo */}
          <Card>
            <CardHeader>
              <CardTitle>{t("products.photo")}</CardTitle>
              <CardDescription>{t("products.photoDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <AppFileUpload
                value={photos}
                onChange={(files) => setPhotos(Array.isArray(files) ? files : [])}
                multiple
                accept="image/*"
                label={t("products.uploadProductPhoto")}
              />
            </CardContent>
          </Card>

          {/* Payment */}
          <Card>
            <CardHeader>
              <CardTitle>{t("sell.payment")}</CardTitle>
              <CardDescription>
                {t("products.paymentDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <Field label={t("products.buyFrom")} strong>
                <SearchableSelect
                  value={supplierId}
                  onValueChange={setSupplierId}
                  options={options?.supplier_wallet_options ?? []}
                  placeholder={t("products.selectSupplierOrPartner")}
                  searchPlaceholder={t("products.supplierSearch")}
                  onCreateNew={(name) =>
                    createInlineWallet(name, "debt", setSupplierId)
                  }
                />
              </Field>

              {scenario === "supplier_debt" ? (
                <div className="space-y-4">
                  <InfoBox color="red" title={t("products.supplierDebtInfoTitle")}>
                    {paidNowEnabled
                      ? t("products.partialSupplierDebtInfo")
                      : t("products.supplierDebtInfo")}
                  </InfoBox>

                  <div className="space-y-4 rounded-lg border bg-muted/40 p-4">
                    <label className="flex cursor-pointer items-start gap-3">
                      <Checkbox
                        checked={paidNowEnabled}
                        onCheckedChange={(checked) => {
                          const next = Boolean(checked);
                          setPaidNowEnabled(next);
                          if (!next) {
                            setPaymentWalletId("");
                            setPaidNowAmount("");
                            setSplitEnabled(false);
                            setPrimarySplitAmount("");
                            setSplitWalletId("");
                          }
                        }}
                        className="mt-1 size-5"
                      />
                      <span>
                        <span className="block text-[13px] font-bold leading-5 text-foreground">
                          {t("products.paidNowEnabled")}
                        </span>
                        <span className="mt-1 block text-[13px] leading-5 text-gray-500">
                          {t("products.paidNowEnabledDescription")}
                        </span>
                      </span>
                    </label>

                    {paidNowEnabled ? (
                      <>
                        <Field label={t("products.paidNowWallet")} strong>
                          <SearchableSelect
                            value={paymentWalletId}
                            onValueChange={setPaymentWalletId}
                            options={options?.split_wallet_options ?? []}
                            placeholder={t("products.selectPaymentWallet")}
                            searchPlaceholder={t("products.walletSearch")}
                            className="h-11"
                            onCreateNew={(name) =>
                              createInlineWallet(name, "card", setPaymentWalletId)
                            }
                          />
                        </Field>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <Field label={t("products.paidNowAmount")} strong>
                            <div className="relative">
                              <Input
                                required
                                type="number"
                                step="1"
                                min="1"
                                placeholder="0"
                                className={`h-11 pr-10 font-bold text-sky-700 ${
                                  paidNowAmountInvalid
                                    ? "border-red-300 bg-red-50 focus-visible:ring-red-500/20"
                                    : "border-sky-200 bg-sky-50/50 focus:bg-background transition-colors"
                                }`}
                                value={paidNowAmount}
                                onChange={(e) => setPaidNowAmount(e.target.value)}
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-sky-700/50 pointer-events-none">
                                ₼
                              </span>
                            </div>
                            {paidNowAmountInvalid ? (
                              <p className="mt-1 text-xs font-semibold text-red-600">
                                {t("products.paidNowAmountError")}
                              </p>
                            ) : null}
                          </Field>

                          <Field label={t("products.remainingSupplierDebt")} strong>
                            <div className="flex h-11 items-center rounded-lg border border-amber-200 bg-amber-50 px-3 font-bold text-amber-700">
                              {partialDebtAmount.toFixed(2)} ₼
                            </div>
                          </Field>
                        </div>

                        <div className="mt-4 space-y-4 border-t border-border pt-4">
                          <label className="flex cursor-pointer items-start gap-3">
                            <Checkbox
                              checked={splitEnabled}
                              onCheckedChange={(checked) => {
                                const next = Boolean(checked);
                                setSplitEnabled(next);
                                if (!next) {
                                  setPrimarySplitAmount("");
                                  setSplitWalletId("");
                                }
                              }}
                              className="mt-1 size-5"
                            />
                            <span>
                              <span className="block text-[13px] font-bold leading-5 text-foreground">
                                {t("products.splitPaidNow")}
                              </span>
                              <span className="mt-1 block text-[13px] leading-5 text-gray-500">
                                {t("products.splitPaidNowDescription")}
                              </span>
                            </span>
                          </label>

                          {splitEnabled ? (
                            <>
                              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <Field label={t("products.amountFromPrimaryAccount")} strong>
                                  <div className="relative">
                                    <Input
                                      required
                                      type="number"
                                      step="1"
                                      min="1"
                                      placeholder="0"
                                      className={`h-11 pr-10 font-bold text-sky-700 ${
                                        splitAmountInvalid
                                          ? "border-red-300 bg-red-50 focus-visible:ring-red-500/20"
                                          : "border-sky-200 bg-background focus:bg-background transition-colors"
                                      }`}
                                      value={primarySplitAmount}
                                      onChange={(e) =>
                                        setPrimarySplitAmount(e.target.value)
                                      }
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-sky-700/50 pointer-events-none">
                                      ₼
                                    </span>
                                  </div>
                                  {splitAmountInvalid ? (
                                    <p className="mt-1 text-xs font-semibold text-red-600">
                                      {t("products.splitPaidNowAmountError")}
                                    </p>
                                  ) : null}
                                </Field>

                                <Field label={t("products.amountFromSecondWallet")} strong>
                                  <div className="flex h-11 items-center rounded-lg border border-sky-200 bg-sky-50 px-3 font-bold text-sky-700">
                                    {secondarySplitAmount.toFixed(2)} ₼
                                  </div>
                                </Field>
                              </div>

                              <Field label={t("products.secondSplitWallet")} strong>
                                <SearchableSelect
                                  value={splitWalletId}
                                  onValueChange={setSplitWalletId}
                                  options={visibleSplitWalletOptions}
                                  placeholder={t("products.selectSecondWallet")}
                                  searchPlaceholder={t("products.walletSearch")}
                                  className="h-11"
                                  onCreateNew={(name) =>
                                    createInlineWallet(name, "card", setSplitWalletId)
                                  }
                                />
                              </Field>
                            </>
                          ) : null}
                        </div>
                      </>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {scenario === "cash_now" ? (
                <InfoBox color="green" title={t("products.cashInfoTitle")}>
                  {t("products.cashInfo")}
                </InfoBox>
              ) : null}

              {scenario === "transfer_now" ? (
                <div className="space-y-4 rounded-lg border border-sky-200 bg-background p-4">
                  <Field label={t("products.primaryAccountOrCard")} strong>
                    <SearchableSelect
                      value={paymentWalletId}
                      onValueChange={setPaymentWalletId}
                      options={options?.payment_wallet_options ?? []}
                      placeholder={t("products.selectCardOrAccount")}
                      searchPlaceholder={t("products.cardOrAccountSearch")}
                      onCreateNew={(name) =>
                        createInlineWallet(name, "card", setPaymentWalletId)
                      }
                    />
                  </Field>
                </div>
              ) : null}

              {scenario !== "supplier_debt" ? (
                <div className="space-y-4 rounded-lg border bg-muted/40 p-4">
                  <label className="flex cursor-pointer items-start gap-3">
                    <Checkbox
                      checked={splitEnabled}
                      onCheckedChange={(checked) =>
                        setSplitEnabled(Boolean(checked))
                      }
                      className="mt-1 size-5"
                    />
                    <span>
                      <span className="block text-[13px] font-bold leading-5 text-foreground">
                        {t("products.splitPayment")}
                      </span>
                      <span className="mt-1 block text-[13px] leading-5 text-gray-500">
                        {t("products.splitPaymentDescription")}
                      </span>
                    </span>
                  </label>

                  {splitEnabled ? (
                    <>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Field
                          label={
                            scenario === "cash_now"
                              ? t("products.amountFromCash")
                              : t("products.amountFromPrimaryAccount")
                          }
                          strong
                        >
                          <div className="relative">
                            <Input
                              required
                              type="number"
                              step="1"
                              min="1"
                              placeholder="0"
                              className={`h-11 pr-10 font-bold text-sky-700 ${
                                splitAmountInvalid
                                  ? "border-red-300 bg-red-50 focus-visible:ring-red-500/20"
                                  : "border-sky-200 bg-sky-50/50 focus:bg-background transition-colors"
                              }`}
                              value={primarySplitAmount}
                              onChange={(e) =>
                                setPrimarySplitAmount(e.target.value)
                              }
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-sky-700/50 pointer-events-none">
                              ₼
                            </span>
                          </div>
                          {splitAmountInvalid ? (
                            <p className="mt-1 text-xs font-semibold text-red-600">
                              {t("products.splitAmountError")}
                            </p>
                          ) : null}
                        </Field>

                        <Field label={t("products.amountFromSecondWallet")} strong>
                          <div className="flex h-11 items-center rounded-lg border border-sky-200 bg-sky-50 px-3 font-bold text-sky-700">
                            {secondarySplitAmount.toFixed(2)} ₼
                          </div>
                        </Field>
                      </div>
                      <Field label={t("products.secondSplitWallet")} strong>
                        <SearchableSelect
                          value={splitWalletId}
                          onValueChange={setSplitWalletId}
                          options={visibleSplitWalletOptions}
                          placeholder={t("products.selectSecondWallet")}
                          searchPlaceholder={t("products.walletSearch")}
                          className="h-11"
                          onCreateNew={(name) =>
                            createInlineWallet(name, "card", setSplitWalletId)
                          }
                        />
                      </Field>
                    </>
                  ) : null}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle>{t("products.summary")}</CardTitle>
              <CardDescription>{t("products.checkBeforeCreate")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <SummaryRow
                label={t("sell.paymentQuestion")}
                value={t(scenarioMeta[scenario].titleKey)}
              />
              <SummaryRow
                label={t("products.buyPrice")}
                value={buyPrice ? `${buyPrice} ₼` : "-"}
              />
              <SummaryRow
                label={t("products.split")}
                value={
                  splitEnabled ? `${secondarySplitAmount.toFixed(2)} ₼` : t("common.no")
                }
              />
              {scenario === "supplier_debt" && paidNowEnabled ? (
                <>
                  <SummaryRow
                    label={t("products.paidNowAmount")}
                    value={
                      paidNowAmount ? `${Number(paidNowAmount).toFixed(2)} ₼` : "-"
                    }
                  />
                  <SummaryRow
                    label={t("products.remainingSupplierDebt")}
                    value={`${partialDebtAmount.toFixed(2)} ₼`}
                  />
                </>
              ) : null}
              <Button
                type="submit"
                disabled={createMutation.isPending || !isFormValid()}
                className="mt-2 w-full py-4"
              >
                {createMutation.isPending ? t("products.creating") : t("products.createPurchase")}
              </Button>
            </CardContent>
          </Card>
        </aside>
      </form>
    </section>
  );
}
