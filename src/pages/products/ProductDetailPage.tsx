import { useEffect, useMemo, useState } from "react";
import {
  BadgeDollarSign,
  CalendarDays,
  Edit,
  ImageIcon,
  Phone,
  ReceiptText,
  Store,
  Trash2,
  Undo2,
} from "lucide-react";
import { NavLink, useLocation, useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";

import {
  useDeleteProduct,
  useUndoProductSale,
} from "@/entities/products/api/use-product-actions";
import { useProductDetail } from "@/entities/products/api/use-product-detail";
import type { ProductDetail } from "@/entities/products/model/types";
import { getApiErrorMessage } from "@/shared/api/error";
import { DetailItem } from "@/features/products/product-display/DetailItem";
import {
  formatProductImei,
  formatProductDate,
  formatProductSupplier,
  getRegistrationLabel,
  isLegacyInstallmentProduct,
} from "@/features/products/product-display/format";
import { ProductStatusBadge } from "@/features/products/product-display/ProductStatusBadge";
import { LegacyInstallmentBadge } from "@/features/products/product-display/RegistrationBadges";
import { SaleCard } from "@/features/products/product-display/SaleCard";
import { SellProductDialog } from "@/features/products/sell-product/SellProductDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/ui/alert-dialog";
import { Button } from "@/shared/ui/button";
import { BackActionButton } from "@/shared/ui/back-button";
import { Card, CardContent } from "@/shared/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { PageHeader } from "@/shared/ui/page-header";
import { Skeleton } from "@/shared/ui/skeleton";
import { toast } from "sonner";

export function ProductDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const productId = Number(params.productId);
  const productQuery = useProductDetail(productId);

  if (productQuery.isLoading) {
    return <ProductDetailSkeleton />;
  }

  if (!productQuery.data) {
    return (
      <Card>
        <CardContent className="p-10 text-center text-sm text-muted-foreground">
          {t("products.notFound")}
        </CardContent>
      </Card>
    );
  }

  return <ProductDetailView product={productQuery.data} />;
}

function ProductDetailView({ product }: { product: ProductDetail }) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [currentProduct, setCurrentProduct] = useState(product);
  const [activeImage, setActiveImage] = useState(product.images[0]?.image_path ?? null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const sale = currentProduct.current_sale;
  const isLegacyInstallment = isLegacyInstallmentProduct(currentProduct);
  const undoSaleMutation = useUndoProductSale(currentProduct.id);
  const deleteProductMutation = useDeleteProduct(currentProduct.id);
  const registrationLabel = useMemo(
    () =>
      currentProduct.registration_statuses.length
        ? currentProduct.registration_statuses.map(getRegistrationLabel).join(", ")
        : "-",
    [currentProduct.registration_statuses],
  );

  useEffect(() => {
    setCurrentProduct(product);
    setActiveImage(product.images[0]?.image_path ?? null);
  }, [product]);

  const productsHref =
    (location.state as { from?: string } | null)?.from ?? "/products";
  const currentPath = `${location.pathname}${location.search}`;

  return (
    <section className="space-y-5">
      <PageHeader
        title={currentProduct.name}
        description={t("products.details")}
        backButton={
          <BackActionButton onClick={() => navigate(productsHref)} />
        }
      />

      <Card className="overflow-hidden p-0">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="border-b bg-muted/40 p-4 lg:border-r lg:border-b-0">
            {activeImage ? (
              <button
                type="button"
                onClick={() => setLightboxImage(activeImage)}
                className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg border bg-background"
              >
                <img
                  src={activeImage}
                  alt={currentProduct.name}
                  className="max-h-full max-w-full object-contain"
                />
              </button>
            ) : (
              <div className="flex aspect-square items-center justify-center rounded-lg border border-dashed bg-background text-muted-foreground">
                <div className="grid justify-items-center gap-2 text-sm">
                  <ImageIcon className="size-10" aria-hidden="true" />
                  {t("products.noPhotos")}
                </div>
              </div>
            )}

            {currentProduct.images.length > 1 ? (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {currentProduct.images.map((image) => (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() => setActiveImage(image.image_path)}
                    className={`size-16 shrink-0 overflow-hidden rounded-lg border ${
                      activeImage === image.image_path
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-border"
                    }`}
                  >
                    <img
                      src={image.image_path}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex min-h-full flex-col p-6">
            <div className="border-b pb-6">
              <div className="flex flex-wrap items-center gap-2">
                <ProductStatusBadge
                  status={currentProduct.status}
                  soldAt={sale?.sold_at}
                />
                {isLegacyInstallment ? <LegacyInstallmentBadge /> : null}
                <span className="font-mono text-sm text-muted-foreground">
                  {formatProductImei(currentProduct)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 py-6 sm:grid-cols-2">
              <DetailItem
                icon={<Store aria-hidden="true" />}
                label={t("catalogs.suppliers")}
                value={formatProductSupplier(currentProduct)}
              />
              <DetailItem
                icon={<BadgeDollarSign aria-hidden="true" />}
                label={t("products.buyPrice")}
                value={`${currentProduct.buy_price} ₼`}
              />
              <DetailItem
                icon={<CalendarDays aria-hidden="true" />}
                label={t("products.createdAt")}
                value={formatProductDate(currentProduct.created_at)}
              />
              <DetailItem
                icon={<ReceiptText aria-hidden="true" />}
                label={t("products.registration")}
                value={registrationLabel}
              />
              <DetailItem
                icon={<Phone aria-hidden="true" />}
                label={t("products.simPhone")}
                value={currentProduct.phone_number ?? "-"}
              />
            </div>

            {sale ? (
              <SaleCard
                sale={sale}
                onPreview={setLightboxImage}
              />
            ) : null}

            <div className="mt-auto grid gap-2 pt-6">
              {currentProduct.status === "in_stock" ? (
                <SellProductDialog
                  product={currentProduct}
                  onSold={setCurrentProduct}
                />
              ) : null}
              {currentProduct.status === "sold" && !isLegacyInstallment ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="outline">
                      <Undo2 aria-hidden="true" />
                      {t("products.undoSale")}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t("products.undoSaleTitle")}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t("products.undoSaleDescription")}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                      <AlertDialogAction
                        disabled={undoSaleMutation.isPending}
                        onClick={() =>
                          undoSaleMutation.mutate(undefined, {
                            onSuccess: (nextProduct) => {
                              setCurrentProduct(nextProduct);
                              toast.warning(t("products.saleUndone"));
                            },
                            onError: (error) => {
                              toast.error(getApiErrorMessage(error));
                            },
                          })
                        }
                      >
                        {undoSaleMutation.isPending ? t("products.undoingSale") : t("products.undoSale")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : null}
              {!isLegacyInstallment ? (
                <>
                  <Button asChild variant="outline">
                    <NavLink
                      to={`/products/${currentProduct.id}/edit`}
                      state={{ from: currentPath, productReturnTo: productsHref }}
                    >
                      <Edit aria-hidden="true" />
                      {t("common.edit")}
                    </NavLink>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button type="button" variant="ghost" className="text-destructive">
                        <Trash2 aria-hidden="true" />
                        {t("products.deleteAction")}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t("products.deleteTitle")}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t("products.deleteWarning")}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive/10 text-destructive hover:bg-destructive/20"
                          onClick={() =>
                            deleteProductMutation.mutate(undefined, {
                              onSuccess: () => {
                                toast.warning(t("products.deleted"));
                                navigate(productsHref, { replace: true });
                              },
                              onError: (error) => {
                                toast.error(getApiErrorMessage(error));
                              },
                            })
                          }
                        >
                          {t("common.delete")}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </Card>

      <Dialog open={Boolean(lightboxImage)} onOpenChange={() => setLightboxImage(null)}>
        <DialogContent className="max-w-5xl border-0 bg-transparent p-0 shadow-none" showCloseButton={false}>
          <DialogHeader className="sr-only">
            <DialogTitle>{t("products.photoPreview")}</DialogTitle>
            <DialogDescription>{t("products.photoPreviewDescription")}</DialogDescription>
          </DialogHeader>
          {lightboxImage ? (
            <img
              src={lightboxImage}
              alt=""
              className="max-h-[90vh] w-full object-contain"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}

function ProductDetailSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Skeleton className="aspect-square w-full" />
      <div className="space-y-4">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  );
}
