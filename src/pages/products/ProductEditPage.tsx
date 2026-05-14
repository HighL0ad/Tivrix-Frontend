import { type ComponentProps, useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useParams } from "react-router";
import { toast } from "sonner";

import { useProductCreateOptions } from "@/entities/products/api/use-product-create";
import { useProductDetail } from "@/entities/products/api/use-product-detail";
import { useUpdateProduct } from "@/entities/products/api/use-product-update";
import { useUpdateProductSalePrice } from "@/entities/products/api/use-product-actions";
import { useCreateWallet } from "@/entities/catalogs/api/use-catalogs";
import { getApiErrorMessage } from "@/shared/api/error";
import { ApiError } from "@/shared/api/http";
import { queryClient } from "@/shared/api/query-client";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { AppFileUpload, AppFormField, AppSelect } from "@/shared/ui/app-form";
import { BackActionButton } from "@/shared/ui/back-button";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { Checkbox } from "@/shared/ui/checkbox";
import { Input } from "@/shared/ui/input";
import { PageHeader } from "@/shared/ui/page-header";
import { PageError, PageLoading } from "@/shared/ui/page-state";
import { SearchableSelect } from "@/shared/ui/searchable-select";
import {
  Field,
  InlineCreate,
  RegistrationCheckboxGroup,
} from "@/features/products/product-form/FormPrimitives";
import { getProductFormErrorMessage, productStatusOptions } from "@/features/products/product-form/model";
import { ProductStatusBadge } from "@/features/products/product-display/ProductStatusBadge";

export function ProductEditPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const params = useParams();
  const navigate = useNavigate();
  const productId = Number(params.productId);
  const productQuery = useProductDetail(productId);
  const optionsQuery = useProductCreateOptions();
  const updateProduct = useUpdateProduct(productId);
  const updateSalePrice = useUpdateProductSalePrice(productId);
  const createWallet = useCreateWallet();

  const product = productQuery.data;
  const [name, setName] = useState("");
  const [imei, setImei] = useState("");
  const [imei2, setImei2] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [newSupplierName, setNewSupplierName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [registrationStatuses, setRegistrationStatuses] = useState<string[]>([]);
  const [status, setStatus] = useState("in_stock");
  const [salePrice, setSalePrice] = useState("");
  const [replacePhotos, setReplacePhotos] = useState(false);
  const [removePhotoIds, setRemovePhotoIds] = useState<number[]>([]);
  const [photos, setPhotos] = useState<File[]>([]);

  useEffect(() => {
    if (!product) return;
    setName(product.name);
    setImei(product.imei);
    setImei2(product.imei2 ?? "");
    setBuyPrice(product.buy_price);
    setSupplierId("");
    setPhoneNumber(product.phone_number ?? "");
    setRegistrationStatuses(product.registration_statuses);
    setStatus(product.status);
    setSalePrice(product.current_sale?.total_price ?? "");
    setRemovePhotoIds([]);
  }, [product]);

  const productError =
    updateProduct.error instanceof ApiError
      ? getProductFormErrorMessage(updateProduct.error.payload)
      : null;
  const salePriceError =
    updateSalePrice.error instanceof ApiError
      ? getApiErrorDetail(updateSalePrice.error.payload)
      : null;
  const error = productError ?? salePriceError;

  const productsHref =
    (location.state as { from?: string } | null)?.from ?? "/products";
  const hasReturnState = Boolean((location.state as { from?: string } | null)?.from);

  const handleSubmit: NonNullable<ComponentProps<"form">["onSubmit"]> = (event) => {
    event.preventDefault();
    if (!product) return;

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("imei", imei.trim());
    formData.append("imei2", imei2.trim());
    formData.append("buy_price", buyPrice);
    if (supplierId) formData.append("supplier_id", supplierId);
    if (phoneNumber.trim()) formData.append("phone_number", phoneNumber.trim());
    registrationStatuses.forEach((status) =>
      formData.append("registration_status", status),
    );
    formData.append("status", status);
    if (replacePhotos) formData.append("replace_photos", "on");
    removePhotoIds.forEach((photoId) =>
      formData.append("remove_photo_ids", String(photoId)),
    );
    photos.forEach((photo) => formData.append("photos", photo));

    const shouldUpdateSalePrice =
      Boolean(product?.current_sale) &&
      salePrice.trim() &&
      salePrice.trim() !== product.current_sale?.total_price;

    updateProduct.mutate(formData, {
      onSuccess: (updatedProduct) => {
        if (!shouldUpdateSalePrice) {
          toast.success(t("products.updated"));
          navigate(`/products/${updatedProduct.id}`, {
            replace: true,
            state: { from: productsHref },
          });
          return;
        }

        updateSalePrice.mutate(salePrice.trim(), {
          onSuccess: (updatedWithSalePrice) => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard"] });
            queryClient.invalidateQueries({ queryKey: ["finance"] });
            toast.success(t("products.updatedWithSalePrice"));
            navigate(`/products/${updatedWithSalePrice.id}`, {
              replace: true,
              state: { from: productsHref },
            });
          },
          onError: (error) => toast.error(getApiErrorMessage(error)),
        });
      },
      onError: (error) =>
        toast.error(getApiErrorMessage(error, t("products.updateError"))),
    });
  };

  if (productQuery.isLoading || optionsQuery.isLoading) {
    return <PageLoading />;
  }

  if (!product || !optionsQuery.data) {
    return <PageError message={t("products.notFound")} />;
  }

  const saleProfit = Number(salePrice || 0) - Number(buyPrice || 0);
  const isSaving = updateProduct.isPending || updateSalePrice.isPending;

  return (
    <section className="mx-auto max-w-6xl space-y-5">
      <BackActionButton
        onClick={() => {
          if (hasReturnState) {
            navigate(-1);
            return;
          }
          navigate(`/products/${product.id}`);
        }}
      />

      <PageHeader
        title={t("products.editTitle")}
        description={`${product.name} · IMEI ${product.imei}`}
      />

      <Card>
        <CardContent className="p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error ? (
              <Alert className="border-red-200 bg-red-50 text-red-700">
                <AlertCircle />
                <AlertDescription className="font-semibold">{error}</AlertDescription>
              </Alert>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("products.model")}>
                <Input value={name} onChange={(event) => setName(event.target.value)} required />
              </Field>
              <Field label={t("products.buyPrice")}>
                <Input
                  value={buyPrice}
                  onChange={(event) => setBuyPrice(event.target.value)}
                  required
                  inputMode="decimal"
                />
              </Field>
              <Field label="IMEI">
                <Input value={imei} onChange={(event) => setImei(event.target.value)} required />
              </Field>
              <Field label={t("products.imei2")}>
                <Input value={imei2} onChange={(event) => setImei2(event.target.value)} />
              </Field>
              <Field label={t("products.simNumber")}>
                <Input
                  value={phoneNumber}
                  onChange={(event) => setPhoneNumber(event.target.value)}
                />
              </Field>
              <Field label={t("common.status")}>
                <AppSelect
                  value={status}
                  onValueChange={setStatus}
                  disabled={product.status === "sold"}
                  options={productStatusOptions
                    .filter((option) => option.value !== "sold" || product.status === "sold")
                    .map((option) => ({ id: option.value, name: t(option.labelKey) }))}
                />
                {product.status === "sold" ? (
                  <div className="mt-2 flex items-center gap-2 text-[13px] leading-5 text-gray-500">
                    <ProductStatusBadge status={product.status} />
                    {t("products.soldStatusLocked")}
                  </div>
                ) : null}
              </Field>
              <Field label={t("catalogs.suppliers")}>
                <SearchableSelect
                  value={supplierId}
                  onValueChange={setSupplierId}
                  options={optionsQuery.data.supplier_wallet_options}
                  placeholder={product.supplier_name ?? t("products.selectSupplier")}
                  searchPlaceholder={t("products.supplierSearch")}
                />
                <InlineCreate
                  value={newSupplierName}
                  onChange={setNewSupplierName}
                  onCreate={() => {
                    const name = newSupplierName.trim();
                    if (!name) return;
                    createWallet.mutate(
                      { name, wallet_type: "debt_supplier" },
                      {
                      onSuccess: (wallet) => {
                        setSupplierId(String(wallet.id));
                        setNewSupplierName("");
                        optionsQuery.refetch();
                        toast.success(t("catalogs.supplierCreated"));
                      },
                      onError: (error) => toast.error(getApiErrorMessage(error)),
                    },
                  );
                  }}
                  placeholder={t("debts.newSupplier")}
                  disabled={createWallet.isPending}
                />
              </Field>
            </div>

            {product.current_sale ? (
              <AppFormField label={t("products.sale")}>
                <div className="grid gap-4 rounded-lg border bg-muted/30 p-4 sm:grid-cols-2">
                  <Field label={t("products.salePrice")}>
                    <Input
                      value={salePrice}
                      onChange={(event) => setSalePrice(event.target.value)}
                      required
                      inputMode="decimal"
                      type="number"
                      min="0"
                      step="1"
                    />
                  </Field>
                  <div className="rounded-lg border bg-background p-3 text-sm">
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground">{t("sell.purchase")}</span>
                      <span className="font-bold">{buyPrice || "0"} ₼</span>
                    </div>
                    <div className="mt-2 flex justify-between gap-3">
                      <span className="text-muted-foreground">{t("products.profit")}</span>
                      <span
                        className={
                          saleProfit >= 0
                            ? "font-bold text-emerald-700"
                            : "font-bold text-rose-700"
                        }
                      >
                        {saleProfit.toFixed(2)} ₼
                      </span>
                    </div>
                  </div>
                </div>
              </AppFormField>
            ) : null}

            <AppFormField label={t("products.registration")}>
              <RegistrationCheckboxGroup
                value={registrationStatuses}
                onChange={setRegistrationStatuses}
              />
            </AppFormField>

            <AppFormField label={t("products.photo")}>
              {product.images.length ? (
                <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {product.images.map((image) => {
                    const selected = removePhotoIds.includes(image.id);
                    return (
                      <label
                        key={image.id}
                        className="group relative overflow-hidden rounded-lg border bg-card"
                      >
                        <img
                          src={image.image_path}
                          alt={product.name}
                          className="aspect-square w-full object-cover"
                        />
                        <span className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-black/65 px-3 py-2 text-xs font-semibold text-white">
                          <Checkbox
                            checked={selected}
                            onCheckedChange={(value) => {
                              setRemovePhotoIds((current) =>
                                value
                                  ? [...current, image.id]
                                  : current.filter((id) => id !== image.id),
                              );
                            }}
                          />
                          {t("products.deletePhoto")}
                        </span>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  {t("products.noCurrentPhotos")}
                </div>
              )}
              <label className="flex items-center gap-2 rounded-lg border p-3 text-sm font-medium">
                <Checkbox
                  checked={replacePhotos}
                  onCheckedChange={(value) => setReplacePhotos(Boolean(value))}
                />
                {t("products.replaceCurrentPhotos")}
              </label>
              <AppFileUpload
                value={photos}
                onChange={(files) => setPhotos(Array.isArray(files) ? files : [])}
                multiple
                accept="image/*"
                label={t("products.selectPhoto")}
              />
            </AppFormField>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? t("common.saving") : t("common.save")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}

function getApiErrorDetail(payload: unknown) {
  if (
    payload &&
    typeof payload === "object" &&
    "detail" in payload &&
    typeof payload.detail === "string"
  ) {
    return payload.detail;
  }

  return "Could not update sale price";
}
