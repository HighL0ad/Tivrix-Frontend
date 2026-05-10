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

import {
  useDeleteProduct,
  useUndoProductSale,
} from "@/entities/products/api/use-product-actions";
import { useProductDetail } from "@/entities/products/api/use-product-detail";
import type { ProductDetail } from "@/entities/products/model/types";
import { getApiErrorMessage } from "@/shared/api/error";
import { DetailItem } from "@/features/products/product-display/DetailItem";
import {
  formatProductDate,
  getRegistrationLabel,
} from "@/features/products/product-display/format";
import { ProductStatusBadge } from "@/features/products/product-display/ProductStatusBadge";
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
import { Card, CardContent } from "@/shared/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Skeleton } from "@/shared/ui/skeleton";
import { toast } from "sonner";

export function ProductDetailPage() {
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
          Товар не найден
        </CardContent>
      </Card>
    );
  }

  return <ProductDetailView product={productQuery.data} />;
}

function ProductDetailView({ product }: { product: ProductDetail }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentProduct, setCurrentProduct] = useState(product);
  const [activeImage, setActiveImage] = useState(product.images[0]?.image_path ?? null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const sale = currentProduct.current_sale;
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
  const hasReturnState = Boolean((location.state as { from?: string } | null)?.from);

  return (
    <section className="space-y-4">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => {
          if (hasReturnState) {
            navigate(-1);
            return;
          }
          navigate(productsHref);
        }}
      >
        <Undo2 className="size-4" aria-hidden="true" />
        Назад
      </Button>

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
                  Нет фотографий
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
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-2xl font-bold text-foreground">
                    {currentProduct.name}
                  </h2>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <ProductStatusBadge
                      status={currentProduct.status}
                      soldAt={sale?.sold_at}
                    />
                    <span className="font-mono text-sm text-muted-foreground">
                      IMEI: {currentProduct.imei}
                      {currentProduct.imei2 ? ` / ${currentProduct.imei2}` : ""}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 py-6 sm:grid-cols-2">
              <DetailItem
                icon={<Store aria-hidden="true" />}
                label="Поставщик"
                value={currentProduct.supplier_name ?? "-"}
              />
              <DetailItem
                icon={<BadgeDollarSign aria-hidden="true" />}
                label="Цена закупки"
                value={`${currentProduct.buy_price} ₼`}
              />
              <DetailItem
                icon={<CalendarDays aria-hidden="true" />}
                label="Добавлен"
                value={formatProductDate(currentProduct.created_at)}
              />
              <DetailItem
                icon={<ReceiptText aria-hidden="true" />}
                label="Регистрация"
                value={registrationLabel}
              />
              <DetailItem
                icon={<Phone aria-hidden="true" />}
                label="Телефон SIM"
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
              {currentProduct.status === "sold" ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="outline">
                      <Undo2 aria-hidden="true" />
                      Отменить сделку
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Отменить сделку?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Товар вернется на склад, а связанные движения денег будут
                        откатаны.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Отмена</AlertDialogCancel>
                      <AlertDialogAction
                        disabled={undoSaleMutation.isPending}
                        onClick={() =>
                          undoSaleMutation.mutate(undefined, {
                            onSuccess: (nextProduct) => {
                              setCurrentProduct(nextProduct);
                              toast.success("Сделка отменена");
                            },
                            onError: (error) => {
                              toast.error(getApiErrorMessage(error));
                            },
                          })
                        }
                      >
                        {undoSaleMutation.isPending ? "Отменяем..." : "Отменить сделку"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : null}
              <Button asChild variant="outline">
                <NavLink
                  to={`/products/${currentProduct.id}/edit`}
                  state={{ from: productsHref }}
                >
                  <Edit aria-hidden="true" />
                  Редактировать
                </NavLink>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="ghost" className="text-destructive">
                    <Trash2 aria-hidden="true" />
                    Удалить товар
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Удалить товар?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Финансовые движения по покупке и продаже будут пересчитаны.
                      Действие нельзя отменить.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Отмена</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive/10 text-destructive hover:bg-destructive/20"
                      onClick={() =>
                        deleteProductMutation.mutate(undefined, {
                          onSuccess: () => navigate(productsHref, { replace: true }),
                        })
                      }
                    >
                      Удалить
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </Card>

      <Dialog open={Boolean(lightboxImage)} onOpenChange={() => setLightboxImage(null)}>
        <DialogContent className="max-w-5xl border-0 bg-transparent p-0 shadow-none" showCloseButton={false}>
          <DialogHeader className="sr-only">
            <DialogTitle>Просмотр фото</DialogTitle>
            <DialogDescription>Увеличенное фото товара</DialogDescription>
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
