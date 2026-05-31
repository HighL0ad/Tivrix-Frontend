import { type ComponentProps, useMemo, useState } from "react";
import { AlertCircle, Banknote, Building2, Check, CreditCard, Phone, Store, UserRound, type LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router";
import { toast } from "sonner";

import {
  checkProductImei,
  useCreateProduct,
  useProductCreateOptions,
} from "@/entities/products/api/use-product-create";
import { useCreateClient } from "@/entities/clients/api/use-clients";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Sheet, SheetContent } from "@/shared/ui/sheet";
import { useMediaQuery } from "@/shared/lib/use-media-query";
import { cn } from "@/shared/lib/utils";
import {
  Field,
  InfoBox,
  RegistrationCheckboxGroup,
  SummaryRow,
} from "@/features/products/product-form/FormPrimitives";
import { ImeiScannerButton } from "@/features/products/product-form/ImeiScannerButton";
import { PhotoMetadataScanStatus } from "@/features/products/product-form/PhotoMetadataScanStatus";
import { ProductFormSkeleton } from "@/features/products/product-form/ProductFormSkeleton";
import {
  getPaymentMethod,
  getProductFormErrorMessage,
  type PurchaseScenario,
  scenarioMeta,
} from "@/features/products/product-form/model";
import { resolveProductsReturnLocation } from "@/features/products/product-return-location";
import type { WalletType } from "@/entities/finance/api/use-finance";
import {
  applyPhotoMetadataToProductFields,
  extractProductMetadataFromPhoto,
} from "@/features/products/product-form/photoMetadataScanner";
import {
  formatImeiInput,
  formatPhoneInput,
} from "@/shared/lib/input-formatters";

const scenarioIcons: Record<PurchaseScenario, LucideIcon> = {
  supplier_debt: Building2,
  cash_now: Banknote,
  transfer_now: CreditCard,
};

export function ProductCreatePage() {
  const { t } = useTranslation();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const location = useLocation();
  const navigate = useNavigate();
  const optionsQuery = useProductCreateOptions();
  const createMutation = useCreateProduct();
  const createWalletMutation = useCreateWallet();
  const createClientMutation = useCreateClient();

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
  const [shopDebtOffset, setShopDebtOffset] = useState(true);
  const [imeiError, setImeiError] = useState("");
  const [checkingImei, setCheckingImei] = useState(false);
  const [isPhotoMetadataScanning, setIsPhotoMetadataScanning] = useState(false);
  const [quickSourceOpen, setQuickSourceOpen] = useState(false);
  const [quickSourceName, setQuickSourceName] = useState("");
  const [quickSourcePhone, setQuickSourcePhone] = useState("");
  const [quickSourceType, setQuickSourceType] =
    useState<"client_debt" | "debt" | "shop">("client_debt");

  const options = optionsQuery.data;
  const buyPriceNumber = Number(buyPrice || 0);
  const paidNowNumber = Number(paidNowAmount || 0);
  const primarySplitNumber = Number(primarySplitAmount || 0);
  const splitTotalAmount =
    scenario === "supplier_debt" && paidNowEnabled
      ? paidNowNumber
      : buyPriceNumber;
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
      if (
        scenario === "supplier_debt" &&
        paidNowEnabled &&
        option.id === paymentWalletId
      )
        return false;
      return true;
    });
  }, [options, paidNowEnabled, paymentWalletId, scenario]);
  const purchaseSourceOptions =
    options?.purchase_source_options ?? options?.supplier_wallet_options ?? [];
  const selectedSource = useMemo(() => {
    return (options?.purchase_source_options ?? []).find((opt) => opt.id === supplierId);
  }, [options?.purchase_source_options, supplierId]);
  const isShopOrSupplierSource = selectedSource && (selectedSource.type === "shop" || selectedSource.type === "debt");
  const isOffsetMode = selectedSource?.type === "client_debt" || (isShopOrSupplierSource && shopDebtOffset);

  const purchaseSourcePlaceholder = t("products.selectPurchaseSource");
  const purchaseSourceSearchPlaceholder = t("products.purchaseSourceSearch");
  const QuickSourceContainer = isMobile ? Sheet : Dialog;
  const QuickSourceContent = isMobile ? SheetContent : DialogContent;
  const sourceTypeOptions = [
    ...(scenario !== "supplier_debt"
      ? [
          {
            value: "client_debt" as const,
            label: t("products.sourceTypeClient"),
            hint: t("products.sourceTypeClientHint"),
            icon: UserRound,
          },
        ]
      : []),
    {
      value: "debt" as const,
      label: t("products.sourceTypeSupplier"),
      hint: t("products.sourceTypeSupplierHint"),
      icon: Building2,
    },
    {
      value: "shop" as const,
      label: t("products.sourceTypePartner"),
      hint: t("products.sourceTypePartnerHint"),
      icon: Store,
    },
  ];

  const productsHref = resolveProductsReturnLocation(
    (location.state as { from?: string } | null)?.from,
  );

  function handleScenarioChange(value: string) {
    const next = value as PurchaseScenario;
    setScenario(next);
    setSupplierId("");
    setPaymentWalletId("");
    setSplitEnabled(false);
    setPrimarySplitAmount("");
    setSplitWalletId("");
    if (next === "supplier_debt") {
      setPaidNowEnabled(false);
      setPaidNowAmount("");
    }
    if (next !== "supplier_debt") {
      setPaidNowEnabled(false);
      setPaidNowAmount("");
    }
  }

  async function checkImeiValue(value: string) {
    const isAlphanumeric = /[^\d-]/.test(value);
    const normalizedImei = isAlphanumeric
      ? value.trim()
      : value.replace(/\D/g, "");

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

  async function handleImeiBlur() {
    await checkImeiValue(imei);
  }

  function handlePrimaryImeiScan(scannedImei: string) {
    const formatted = formatImeiInput(scannedImei);
    setImei(formatted);
    checkImeiValue(formatted);
  }

  async function handlePhotosChange(files: File | File[] | null) {
    const nextPhotos = Array.isArray(files) ? files : [];
    setPhotos(nextPhotos);

    const photo = nextPhotos.find((file) => file.type.startsWith("image/"));
    if (!photo) return;

    setIsPhotoMetadataScanning(true);
    try {
      const metadata = await extractProductMetadataFromPhoto(photo);
      const nextFields = applyPhotoMetadataToProductFields(metadata, {
        name,
        imei,
        imei2,
      });
      const filledName = !name.trim() && nextFields.name;
      const filledImei = !imei.trim() && nextFields.imei;
      const filledImei2 = !imei2.trim() && nextFields.imei2;

      if (filledName) setName(nextFields.name);
      if (filledImei) {
        setImei(nextFields.imei);
        await checkImeiValue(nextFields.imei);
      }
      if (filledImei2) setImei2(nextFields.imei2);

      if (filledName || filledImei || filledImei2) {
        toast.success(
          t("ru") === "ru"
            ? "Данные с фото распознаны"
            : "Fotodan məlumatlar oxundu",
        );
      }
    } catch (err) {
      console.warn("[PRODUCT PHOTO OCR] Failed to read photo", err);
      toast.error(
        t("ru") === "ru"
          ? "Не удалось распознать данные с фото"
          : "Fotodan məlumatları oxumaq mümkün olmadı",
      );
    } finally {
      setIsPhotoMetadataScanning(false);
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
    const isAlphanumeric = /[^\d-]/.test(imei);
    formData.append(
      "imei",
      isAlphanumeric ? imei.trim() : imei.replace(/\D/g, ""),
    );
    formData.append("buy_price", buyPrice);
    formData.append("supplier_id", supplierId);
    formData.append(
      "payment_method",
      scenario === "supplier_debt" && paidNowEnabled
        ? "partial_debt"
        : getPaymentMethod(scenario),
    );

    if (imei2.trim()) {
      const isImei2Alphanumeric = /[^\d-]/.test(imei2);
      formData.append(
        "imei2",
        isImei2Alphanumeric ? imei2.trim() : imei2.replace(/\D/g, ""),
      );
    }
    if (phoneNumber.trim()) formData.append("phone_number", phoneNumber.trim());
    if (
      scenario === "transfer_now" ||
      (scenario === "supplier_debt" && paidNowEnabled)
    )
      formData.append("wallet_id", paymentWalletId);
    if (scenario === "supplier_debt" && paidNowEnabled)
      formData.append("paid_now_amount", paidNowAmount);
    if (scenario === "supplier_debt" && isShopOrSupplierSource) {
      formData.append("shop_debt_offset", shopDebtOffset ? "true" : "false");
    }

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
        toast.error(
          getApiErrorMessage(error, t("products.createPurchaseError")),
        ),
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

  function openQuickSourceDialog(query: string) {
    setQuickSourceName(query);
    setQuickSourcePhone("");
    setQuickSourceType(scenario === "supplier_debt" ? "debt" : "client_debt");
    setQuickSourceOpen(true);
  }

  const handleQuickSourceSubmit: NonNullable<ComponentProps<"form">["onSubmit"]> = async (event) => {
    event.preventDefault();
    const trimmedName = quickSourceName.trim();
    if (!trimmedName) return;

    try {
      if (quickSourceType === "client_debt") {
        const client = await createClientMutation.mutateAsync({
          name: trimmedName,
          phone: quickSourcePhone.trim() || undefined,
        });
        const refreshed = await optionsQuery.refetch();
        const createdOption = refreshed.data?.purchase_source_options.find(
          (option) =>
            option.type === "client_debt" &&
            option.name.replace(/^[^:]+:\s*/, "").trim() === client.name,
        );
        if (createdOption) setSupplierId(createdOption.id);
      } else {
        const wallet = await createWalletMutation.mutateAsync({
          name: trimmedName,
          wallet_type: quickSourceType,
        });
        setSupplierId(String(wallet.id));
        await optionsQuery.refetch();
      }

      setQuickSourceOpen(false);
      setQuickSourceName("");
      setQuickSourcePhone("");
      toast.success(t("products.purchaseSourceCreated"));
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  if (optionsQuery.isLoading) {
    return <ProductFormSkeleton sidebar />;
  }

  return (
    <section className="mx-auto max-w-6xl space-y-5">
      <PageHeader
        title={t("products.newPurchase")}
        description={t("products.newPurchaseDescription")}
        backButton={<BackActionButton onClick={() => navigate(productsHref)} />}
      />

      <form
        onSubmit={handleSubmit}
        className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]"
      >
        <div className="min-w-0 space-y-4">
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
                    const Icon = scenarioIcons[value];
                    return (
                      <label
                        key={value}
                        className={cn(
                          "relative flex flex-col items-center justify-between text-center cursor-pointer gap-3 rounded-xl border p-5 transition-all duration-200 select-none shadow-sm hover:shadow",
                          selected
                            ? "border-primary bg-primary/[0.04] text-primary ring-2 ring-primary/20 scale-[1.02]"
                            : "border-border bg-background hover:border-primary/30 hover:bg-muted/10",
                        )}
                      >
                        <RadioGroupItem value={value} className="sr-only" />
                        {selected && (
                          <div className="absolute right-2 top-2 rounded-full bg-primary p-0.5 text-primary-foreground">
                            <Check className="size-3 stroke-[3px]" />
                          </div>
                        )}
                        <div className={cn(
                          "rounded-full p-2.5 transition-colors duration-200",
                          selected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                        )}>
                          <Icon className="size-5 shrink-0" />
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                          <span className="block text-sm font-bold leading-5 tracking-tight">
                            {t(meta.titleKey)}
                          </span>
                          <span className="block text-xs leading-4 text-muted-foreground/80 font-medium">
                            {t(meta.descriptionKey)}
                          </span>
                        </div>
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
              <CardDescription>
                {t("products.mainDataDescription")}
              </CardDescription>
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
                  <div className="relative flex items-center w-full">
                    <Input
                      required
                      placeholder="35..."
                      className={`font-mono pr-10 w-full ${
                        imeiError
                          ? "border-red-300 bg-red-50 focus-visible:ring-red-500/20"
                          : ""
                      }`}
                      value={imei}
                      onChange={(e) => setImei(formatImeiInput(e.target.value))}
                      onBlur={handleImeiBlur}
                    />
                    <div className="absolute right-1 flex items-center">
                      <ImeiScannerButton onScan={handlePrimaryImeiScan} />
                    </div>
                  </div>
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
                  <div className="relative flex items-center w-full">
                    <Input
                      placeholder={t("common.optional")}
                      className="font-mono pr-10 w-full"
                      value={imei2}
                      onChange={(e) =>
                        setImei2(formatImeiInput(e.target.value))
                      }
                    />
                    <div className="absolute right-1 flex items-center">
                      <ImeiScannerButton
                        onScan={(scannedImei) =>
                          setImei2(formatImeiInput(scannedImei))
                        }
                      />
                    </div>
                  </div>
                </Field>

                <Field label={t("products.phoneNumber")}>
                  <Input
                    type="tel"
                    placeholder="+994..."
                    className="font-mono"
                    value={phoneNumber}
                    onChange={(e) =>
                      setPhoneNumber(formatPhoneInput(e.target.value))
                    }
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
              <CardDescription>
                {t("products.photoDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AppFileUpload
                value={photos}
                onChange={handlePhotosChange}
                multiple
                accept="image/*"
                label={t("products.uploadProductPhoto")}
              />
              {isPhotoMetadataScanning ? (
                <PhotoMetadataScanStatus
                  text={
                    t("ru") === "ru"
                      ? "Считываем модель и IMEI с фото"
                      : "Fotodan model və IMEI oxunur"
                  }
                />
              ) : null}
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
            <CardContent className="min-w-0 space-y-5">
              <Field label={t("products.buyFrom")} strong>
                <SearchableSelect
                  value={supplierId}
                  onValueChange={setSupplierId}
                  options={purchaseSourceOptions}
                  placeholder={purchaseSourcePlaceholder}
                  searchPlaceholder={purchaseSourceSearchPlaceholder}
                  onCreateNew={openQuickSourceDialog}
                  createNewFormat={
                    t("products.createPurchaseSourceFormat")
                  }
                />
              </Field>

              {scenario === "supplier_debt" && isShopOrSupplierSource && (
                <div className="space-y-4 rounded-lg border bg-muted/40 p-4">
                  <label className="flex cursor-pointer items-start gap-3 select-none">
                    <Checkbox
                      checked={shopDebtOffset}
                      onCheckedChange={(checked) =>
                        setShopDebtOffset(Boolean(checked))
                      }
                      className="mt-1 size-5"
                    />
                    <span>
                      <span className="block text-[13px] font-bold leading-5 text-foreground">
                        {t("debts.borrowOffset")}
                      </span>
                      <span className="mt-1 block text-xs leading-4 text-gray-500 font-medium">
                        {t("debts.borrowOffsetDescription")}
                      </span>
                    </span>
                  </label>
                </div>
              )}

              {scenario === "supplier_debt" ? (
                <div className="min-w-0 space-y-4">
                  <InfoBox
                    color="red"
                    title={
                      isOffsetMode
                        ? t("products.scenario.supplierDebt.clientTitle")
                        : t("products.supplierDebtInfoTitle")
                    }
                  >
                    {isOffsetMode
                      ? (paidNowEnabled
                          ? t("products.scenario.supplierDebt.clientInfoPartial")
                          : t("products.scenario.supplierDebt.clientInfo"))
                      : (paidNowEnabled
                          ? t("products.partialSupplierDebtInfo")
                          : t("products.supplierDebtInfo"))}
                  </InfoBox>

                  <div className="min-w-0 space-y-4 rounded-lg border bg-muted/40 p-4">
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
                              createInlineWallet(
                                name,
                                "card",
                                setPaymentWalletId,
                              )
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
                                onChange={(e) =>
                                  setPaidNowAmount(e.target.value)
                                }
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

                          <Field
                            label={t("products.remainingSupplierDebt")}
                            strong
                          >
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
                                <Field
                                  label={t("products.amountFromPrimaryAccount")}
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

                                <Field
                                  label={t("products.amountFromSecondWallet")}
                                  strong
                                >
                                  <div className="flex h-11 items-center rounded-lg border border-sky-200 bg-sky-50 px-3 font-bold text-sky-700">
                                    {secondarySplitAmount.toFixed(2)} ₼
                                  </div>
                                </Field>
                              </div>

                              <Field
                                label={t("products.secondSplitWallet")}
                                strong
                              >
                                <SearchableSelect
                                  value={splitWalletId}
                                  onValueChange={setSplitWalletId}
                                  options={visibleSplitWalletOptions}
                                  placeholder={t("products.selectSecondWallet")}
                                  searchPlaceholder={t("products.walletSearch")}
                                  className="h-11"
                                  onCreateNew={(name) =>
                                    createInlineWallet(
                                      name,
                                      "card",
                                      setSplitWalletId,
                                    )
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
                <div className="min-w-0 space-y-4 rounded-lg border border-sky-200 bg-background p-4">
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
                <div className="min-w-0 space-y-4 rounded-lg border bg-muted/40 p-4">
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

                        <Field
                          label={t("products.amountFromSecondWallet")}
                          strong
                        >
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
        <aside className="min-w-0 space-y-4 lg:sticky lg:top-6 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle>{t("products.summary")}</CardTitle>
              <CardDescription>
                {t("products.checkBeforeCreate")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <SummaryRow
                label={t("sell.paymentQuestion")}
                value={
                  scenario === "supplier_debt" && isOffsetMode
                    ? t("products.scenario.supplierDebt.clientTitle")
                    : t(scenarioMeta[scenario].titleKey)
                }
              />
              <SummaryRow
                label={t("products.buyPrice")}
                value={buyPrice ? `${buyPrice} ₼` : "-"}
              />
              <SummaryRow
                label={t("products.split")}
                value={
                  splitEnabled
                    ? `${secondarySplitAmount.toFixed(2)} ₼`
                    : t("common.no")
                }
              />
              {scenario === "supplier_debt" && paidNowEnabled ? (
                <>
                  <SummaryRow
                    label={t("products.paidNowAmount")}
                    value={
                      paidNowAmount
                        ? `${Number(paidNowAmount).toFixed(2)} ₼`
                        : "-"
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
                {createMutation.isPending
                  ? t("products.creating")
                  : t("products.createPurchase")}
              </Button>
            </CardContent>
          </Card>
        </aside>
      </form>

      <QuickSourceContainer
        open={quickSourceOpen}
        onOpenChange={setQuickSourceOpen}
      >
        <QuickSourceContent
          className={
            isMobile
              ? "rounded-t-2xl border-border bg-card p-0"
              : "sm:max-w-[540px] overflow-hidden p-0"
          }
        >
          <div className="border-b bg-muted/30 px-5 py-4">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                {t("products.createPurchaseSource")}
              </DialogTitle>
              <p className="text-[13px] leading-5 text-muted-foreground">
                {t("products.createPurchaseSourceDescription")}
              </p>
            </DialogHeader>
          </div>

          <form className="space-y-5 px-5 py-4" onSubmit={handleQuickSourceSubmit}>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {t("products.sourceType")}
              </label>
              <RadioGroup
                value={quickSourceType}
                onValueChange={(value) =>
                  setQuickSourceType(value as "client_debt" | "debt" | "shop")
                }
                className="grid gap-3 sm:grid-cols-3"
              >
                {sourceTypeOptions.map((option) => {
                  const selected = quickSourceType === option.value;
                  const Icon = option.icon;
                  return (
                    <label
                      key={option.value}
                      className={cn(
                        "relative flex flex-col items-center justify-between text-center cursor-pointer gap-2 rounded-xl border p-4 transition-all duration-200 select-none shadow-sm hover:shadow",
                        selected
                          ? "border-primary bg-primary/[0.04] text-primary ring-2 ring-primary/20 scale-[1.02]"
                          : "border-border bg-background hover:border-primary/30 hover:bg-muted/10",
                      )}
                    >
                      <RadioGroupItem value={option.value} className="sr-only" />
                      {selected && (
                        <div className="absolute right-2 top-2 rounded-full bg-primary p-0.5 text-primary-foreground">
                          <Check className="size-3 stroke-[3px]" />
                        </div>
                      )}
                      <div className={cn(
                        "rounded-full p-2.5 transition-colors duration-200",
                        selected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                      )}>
                        <Icon className="size-5 shrink-0" />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-sm font-semibold tracking-tight">
                          {option.label}
                        </span>
                        <span className="mt-1 block text-[10px] leading-3 text-muted-foreground/80 font-medium">
                          {option.hint}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </RadioGroup>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {t("common.name")} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <UserRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/70" />
                  <Input
                    value={quickSourceName}
                    onChange={(event) => setQuickSourceName(event.target.value)}
                    required
                    autoFocus={!isMobile}
                    className="pl-9"
                  />
                </div>
              </div>

              {quickSourceType === "client_debt" ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {t("products.phone")}
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/70" />
                    <Input
                      value={quickSourcePhone}
                      onChange={(event) =>
                        setQuickSourcePhone(formatPhoneInput(event.target.value))
                      }
                      placeholder="+994..."
                      className="pl-9"
                    />
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setQuickSourceOpen(false)}
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={
                  createWalletMutation.isPending || createClientMutation.isPending
                }
              >
                {createWalletMutation.isPending || createClientMutation.isPending
                  ? t("common.saving")
                  : t("common.save")}
              </Button>
            </div>
          </form>
        </QuickSourceContent>
      </QuickSourceContainer>
    </section>
  );
}
