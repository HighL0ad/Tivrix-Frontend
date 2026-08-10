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
  ZoomIn,
  ZoomOut,
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
import { Input } from "@/shared/ui/input";
import { ResponsiveModal } from "@/shared/ui/app-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { PageHeader } from "@/shared/ui/page-header";
import { toast } from "sonner";
import { resolveProductsReturnLocation } from "@/features/products/product-return-location";
import { ProductDetailSkeleton } from "@/features/products/ProductDetailSkeleton";

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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");

  const handleOpenDeleteDialogChange = (open: boolean) => {
    setIsDeleteDialogOpen(open);
    if (!open) {
      setDeleteConfirmName("");
    }
  };
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
    resolveProductsReturnLocation((location.state as { from?: string } | null)?.from);
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
                  <ResponsiveModal
                    open={isDeleteDialogOpen}
                    onOpenChange={handleOpenDeleteDialogChange}
                    trigger={
                      <Button type="button" variant="ghost" className="text-destructive">
                        <Trash2 aria-hidden="true" />
                        {t("products.deleteAction")}
                      </Button>
                    }
                    title={t("products.deleteTitle")}
                    className="md:max-w-md"
                    footer={
                      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end w-full">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleOpenDeleteDialogChange(false)}
                        >
                          {t("common.cancel")}
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          disabled={
                            deleteConfirmName.trim().toLowerCase() !== currentProduct.name.trim().toLowerCase() ||
                            deleteProductMutation.isPending
                          }
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
                        </Button>
                      </div>
                    }
                  >
                    <div className="space-y-4">
                      <div className="text-sm text-muted-foreground space-y-2">
                        <p>
                          {t("products.deleteDescription", { name: currentProduct.name })}
                        </p>
                        <div className="border-l-2 border-border pl-3 space-y-1 my-2">
                          <span className="block text-xs font-semibold text-foreground">
                            {formatProductImei(currentProduct)}
                          </span>
                          {currentProduct.supplier_name ? (
                            <span className="block text-xs text-muted-foreground">
                              {t("products.supplierWithColon", { name: formatProductSupplier(currentProduct) })}
                            </span>
                          ) : null}
                        </div>
                        <p className="text-xs text-destructive font-medium bg-destructive/5 p-2 rounded-lg border border-destructive/10">
                          {t("products.deleteWarning")}
                        </p>
                      </div>

                      <div className="space-y-1.5 text-left">
                        <label className="text-xs font-semibold text-muted-foreground">
                          {t("products.deleteConfirmPrompt")}{" "}
                          <span className="font-bold text-foreground select-all">{currentProduct.name}</span>
                        </label>
                        <Input
                          value={deleteConfirmName}
                          onChange={(e) => setDeleteConfirmName(e.target.value)}
                          placeholder={t("products.deleteConfirmPlaceholder")}
                        />
                      </div>
                    </div>
                  </ResponsiveModal>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </Card>

      <Dialog open={Boolean(lightboxImage)} onOpenChange={() => setLightboxImage(null)}>
        <DialogContent mobileVariant="dialog" className="max-w-5xl border-0 bg-transparent p-0 shadow-none" showCloseButton={false}>
          <DialogHeader className="sr-only">
            <DialogTitle>{t("products.photoPreview")}</DialogTitle>
            <DialogDescription>{t("products.photoPreviewDescription")}</DialogDescription>
          </DialogHeader>
          {lightboxImage ? (
            <LightboxImage src={lightboxImage} />
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}

function LightboxImage({ src }: { src: string }) {
  const { t } = useTranslation();
  const [isZoomed, setIsZoomed] = useState(false);
  const [position, setPosition] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return;
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setPosition({ x, y });
  };

  const handleMouseLeave = () => {
    setIsZoomed(false);
  };

  return (
    <div
      className="relative select-none overflow-hidden rounded-lg bg-black/5"
      style={{ cursor: isZoomed ? "zoom-out" : "zoom-in" }}
      onClick={() => setIsZoomed(!isZoomed)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Zoom hint pill */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 rounded-full bg-slate-950/65 px-3 py-1.5 text-xs font-bold text-white shadow-md backdrop-blur-md transition-all">
        {isZoomed ? (
          <>
            <ZoomOut className="size-3.5 text-sky-400" />
            <span>{t("products.zoomClickToReset")}</span>
          </>
        ) : (
          <>
            <ZoomIn className="size-3.5 text-sky-400" />
            <span>{t("products.zoomClickToMagnify")}</span>
          </>
        )}
      </div>

      <div className="flex max-h-[85vh] min-h-[50vh] w-full items-center justify-center overflow-hidden">
        <img
          src={src}
          alt=""
          className="max-h-[85vh] w-full object-contain transition-transform duration-150 ease-out pointer-events-none"
          style={{
            transform: isZoomed ? "scale(2.5)" : "scale(1)",
            transformOrigin: isZoomed ? `${position.x}% ${position.y}%` : "center",
          }}
        />
      </div>
    </div>
  );
}
