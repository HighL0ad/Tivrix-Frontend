import { type ComponentProps, type ReactNode, useEffect, useMemo, useState } from "react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import {
  ArrowDown,
  ArrowUp,
  ChevronsUpDown,
  Copy,
  Edit,
  Eye,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";
import { NavLink, useLocation, useNavigate } from "react-router";
import { toast } from "sonner";

import { useDeleteProduct } from "@/entities/products/api/use-product-actions";
import { useProductCreateOptions } from "@/entities/products/api/use-product-create";
import { useProductDetail } from "@/entities/products/api/use-product-detail";
import { useProducts } from "@/entities/products/api/use-products";
import type {
  ProductDetail,
  ProductListItem,
  ProductStatus,
} from "@/entities/products/model/types";
import { formatProductDate } from "@/features/products/product-display/format";
import { ProductStatusBadge } from "@/features/products/product-display/ProductStatusBadge";
import { RegistrationBadges } from "@/features/products/product-display/RegistrationBadges";
import { SellProductDialog } from "@/features/products/sell-product/SellProductDialog";
import { queryClient } from "@/shared/api/query-client";
import { useMediaQuery } from "@/shared/lib/use-media-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { ResponsiveModal } from "@/shared/ui/app-form";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader } from "@/shared/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Input } from "@/shared/ui/input";
import { EmptyState } from "@/shared/ui/empty-state";
import { PageHeader } from "@/shared/ui/page-header";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/shared/ui/pagination";
import { Skeleton } from "@/shared/ui/skeleton";
import { SearchableSelect } from "@/shared/ui/searchable-select";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";

const statusFilters: Array<{ value: ProductStatus | "all"; label: string }> = [
  { value: "all", label: "Все" },
  { value: "in_stock", label: "На складе" },
  { value: "sold", label: "Проданы" },
  { value: "reserved", label: "Бронь" },
];
const productStatusValues = ["new", "in_stock", "sold", "reserved", "returned"] as const;
const productSortFields = ["name", "supplier", "buy_price", "deal_price"] as const;
const sortDirections = ["asc", "desc"] as const;

export function ProductsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [{ status, supplierId, q, sortBy, sortDir, page }, setProductParams] = useQueryStates({
    status: parseAsStringLiteral(productStatusValues),
    supplierId: parseAsString.withDefault(""),
    q: parseAsString.withDefault(""),
    sortBy: parseAsStringLiteral(productSortFields),
    sortDir: parseAsStringLiteral(sortDirections),
    page: parseAsInteger.withDefault(1),
  });
  const activeStatus = status ?? undefined;
  const [searchValue, setSearchValue] = useState(q);
  const createOptionsQuery = useProductCreateOptions();
  const productsQuery = useProducts({
    status: activeStatus,
    supplierId: supplierId || undefined,
    q,
    sortBy: sortBy ?? undefined,
    sortDir: sortDir ?? undefined,
    page,
  });
  const products = productsQuery.data;
  const supplierOptions = useMemo(
    () => [
      { id: "all", name: "Все поставщики" },
      ...(
        createOptionsQuery.data?.supplier_wallet_options.map((supplier) => ({
          id: supplier.id,
          name: supplier.name,
        })) ?? []
      ),
    ],
    [createOptionsQuery.data?.supplier_wallet_options],
  );

  useEffect(() => {
    setSearchValue(q);
  }, [q]);

  function updateParams(next: {
    status?: ProductStatus | "all";
    supplierId?: string;
    q?: string;
    sortBy?: (typeof productSortFields)[number] | null;
    sortDir?: (typeof sortDirections)[number] | null;
    page?: number;
  }) {
    setProductParams({
      status:
        next.status === undefined
          ? status
          : next.status === "all"
            ? null
            : next.status,
      supplierId: next.supplierId === undefined ? supplierId : next.supplierId,
      q: next.q === undefined ? q : next.q.trim(),
      sortBy: next.sortBy === undefined ? sortBy : next.sortBy,
      sortDir: next.sortDir === undefined ? sortDir : next.sortDir,
      page:
        next.status !== undefined ||
        next.supplierId !== undefined ||
        next.q !== undefined ||
        next.sortBy !== undefined ||
        next.sortDir !== undefined
          ? 1
          : next.page,
    });
  }

  useEffect(() => {
    function handleHotkey(event: KeyboardEvent) {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "n") {
        return;
      }
      if (isTypingTarget(event.target)) {
        return;
      }
      event.preventDefault();
      navigate("/products/new");
    }

    window.addEventListener("keydown", handleHotkey);
    return () => window.removeEventListener("keydown", handleHotkey);
  }, [navigate]);

  const handleSearch: NonNullable<ComponentProps<"form">["onSubmit"]> = (
    event,
  ) => {
    event.preventDefault();
    updateParams({ q: searchValue });
  };
  const returnTo = `${location.pathname}${location.search}`;

  return (
    <section className="space-y-5">
      <PageHeader
        title="Товары"
        description={products ? `Всего товаров: ${products.total}` : "Загрузка товаров"}
        actions={
        <Button asChild>
          <NavLink to="/products/new">
            <Plus aria-hidden="true" />
            Добавить товар
            <span className="rounded-md bg-white/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground/85">
              Ctrl+N
            </span>
          </NavLink>
        </Button>
        }
      />

      <Card>
        <CardHeader className="gap-4">
          <Tabs
            value={activeStatus ?? "all"}
            onValueChange={(value) =>
              updateParams({ status: value as ProductStatus | "all" })
            }
          >
            <TabsList>
              {statusFilters.map((filter) => (
                <TabsTrigger key={filter.value} value={filter.value}>
                  {filter.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <form onSubmit={handleSearch} className="flex flex-col gap-2 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                className="pl-9"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="IMEI, модель, поставщик, цена..."
              />
            </div>
            <Button type="submit" className="sm:w-28">Найти</Button>
            {q ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Очистить поиск"
                    onClick={() => {
                      setSearchValue("");
                      updateParams({ q: "" });
                    }}
                  >
                    <X aria-hidden="true" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Очистить поиск</TooltipContent>
              </Tooltip>
            ) : null}
          </form>

          <div className="grid gap-2 sm:grid-cols-[minmax(0,260px)_auto]">
            <SearchableSelect
              value={supplierId || "all"}
              onValueChange={(value) =>
                updateParams({ supplierId: value === "all" ? "" : value })
              }
              options={supplierOptions}
              placeholder="Все поставщики"
              searchPlaceholder="Поиск поставщика"
              emptyMessage="Поставщик не найден"
            />
            {(supplierId || sortBy) ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => updateParams({ supplierId: "", sortBy: null, sortDir: null })}
              >
                Сбросить фильтры
              </Button>
            ) : null}
          </div>
        </CardHeader>

        <CardContent>
          {productsQuery.isLoading ? (
            isDesktop ? <ProductsTableSkeleton /> : <ProductsCardListSkeleton />
          ) : products && products.items.length > 0 ? (
            isDesktop ? (
              <ProductsTable
                products={products.items}
                returnTo={returnTo}
                sortBy={sortBy ?? null}
                sortDir={sortDir ?? null}
                onSortChange={(nextSortBy, nextSortDir) =>
                  updateParams({ sortBy: nextSortBy, sortDir: nextSortDir })
                }
              />
            ) : (
              <ProductsCardList
                products={products.items}
                returnTo={returnTo}
              />
            )
          ) : (
            <EmptyState
              title="Товары не найдены"
              description={
                q || supplierId || activeStatus
                  ? "Попробуйте сбросить фильтры или изменить запрос."
                  : "Добавьте первый товар, чтобы начать работу."
              }
              action={
                q || supplierId || activeStatus ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSearchValue("");
                      setProductParams({
                        status: null,
                        supplierId: "",
                        q: "",
                        sortBy: null,
                        sortDir: null,
                        page: 1,
                      });
                    }}
                  >
                    Сбросить фильтры
                  </Button>
                ) : (
                  <Button asChild>
                    <NavLink to="/products/new">
                      <Plus aria-hidden="true" />
                      Добавить первый товар
                    </NavLink>
                  </Button>
                )
              }
            />
          )}

          {products ? (
            <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <span className="shrink-0 whitespace-nowrap">
                Страница {products.page} / {products.total_pages}
              </span>
              <Pagination className="shrink-0">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      disabled={products.page <= 1}
                      onClick={() => updateParams({ page: products.page - 1 })}
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      disabled={products.page >= products.total_pages}
                      onClick={() => updateParams({ page: products.page + 1 })}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}

function ProductsCardList({
  products,
  returnTo,
}: {
  products: ProductListItem[];
  returnTo: string;
}) {
  const navigate = useNavigate();
  const rowVirtualizer = useWindowVirtualizer({
    count: products.length,
    estimateSize: () => 260,
    overscan: 4,
  });
  const virtualItems = rowVirtualizer.getVirtualItems();

  return (
    <div
      className="relative md:hidden"
      style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
    >
      {virtualItems.map((virtualItem) => {
        const product = products[virtualItem.index];

        return (
          <div
            key={product.id}
            data-index={virtualItem.index}
            ref={rowVirtualizer.measureElement}
            className="absolute left-0 top-0 w-full pb-3"
            style={{ transform: `translateY(${virtualItem.start}px)` }}
          >
            <article className="overflow-hidden rounded-lg border bg-card shadow-sm transition-colors hover:bg-muted/30">
              <button
                type="button"
                className="w-full p-4 text-left"
                onClick={() =>
                  navigate(`/products/${product.id}`, { state: { from: returnTo } })
                }
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="break-words font-bold text-foreground">{product.name}</div>
                    <div className="mt-1 font-mono text-xs text-muted-foreground">
                      IMEI: {product.imei}
                      {product.imei2 ? ` / ${product.imei2}` : ""}
                    </div>
                  </div>
                  <ProductStatusBadge status={product.status} />
                </div>

                <RegistrationBadges statuses={product.registration_statuses} />

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-xs font-bold uppercase text-muted-foreground">
                      Поставщик
                    </div>
                    <div className="mt-1 break-words font-semibold">
                      {product.supplier_name ?? "-"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold uppercase text-muted-foreground">
                      Закупка
                    </div>
                    <div className="mt-1 font-black">{product.buy_price} ₼</div>
                  </div>
                </div>

                <div className="mt-3 rounded-lg bg-muted px-3 py-2 text-sm">
                  {product.current_sale ? (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Сделка</span>
                      <span className="font-black">
                        {product.current_sale.total_price} ₼
                        <span className="ml-2 text-emerald-700">
                          +{product.current_sale.profit} ₼
                        </span>
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Добавлен</span>
                      <span className="font-semibold">
                        {formatProductDate(product.created_at)}
                      </span>
                    </div>
                  )}
                </div>
              </button>

              <div className="border-t bg-background/70 p-3">
                {product.status === "in_stock" ? (
                  <div className="grid grid-cols-[1fr_auto] gap-2">
                    <SellProductByIdDialog
                      productId={product.id}
                      trigger={
                        <Button type="button" className="w-full">
                          Продать
                        </Button>
                      }
                    />
                    <ProductActionsMenu
                      product={product}
                      returnTo={returnTo}
                      compact
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        navigate(`/products/${product.id}`, {
                          state: { from: returnTo },
                        })
                      }
                    >
                      Детали
                    </Button>
                    <Button asChild type="button" variant="outline">
                      <NavLink
                        to={`/products/${product.id}/edit`}
                        state={{ from: returnTo }}
                      >
                        Редактировать
                      </NavLink>
                    </Button>
                  </div>
                )}
              </div>
            </article>
          </div>
        );
      })}
    </div>
  );
}

function ProductsTable({
  products,
  returnTo,
  sortBy,
  sortDir,
  onSortChange,
}: {
  products: ProductListItem[];
  returnTo: string;
  sortBy: (typeof productSortFields)[number] | null;
  sortDir: (typeof sortDirections)[number] | null;
  onSortChange: (
    sortBy: (typeof productSortFields)[number] | null,
    sortDir: (typeof sortDirections)[number] | null,
  ) => void;
}) {
  const navigate = useNavigate();
  const sorting = useMemo<SortingState>(
    () => (sortBy && sortDir ? [{ id: sortBy, desc: sortDir === "desc" }] : []),
    [sortBy, sortDir],
  );
  const columns = useMemo<ColumnDef<ProductListItem>[]>(
    () => [
      {
        id: "name",
        accessorKey: "name",
        header: () => "Товар",
        cell: ({ row }) => (
          <TableCellContent>
            <div className="font-medium text-foreground">{row.original.name}</div>
            <div className="mt-1 font-mono text-xs text-muted-foreground">
              IMEI: {row.original.imei}
              {row.original.imei2 ? ` / ${row.original.imei2}` : ""}
            </div>
            <RegistrationBadges statuses={row.original.registration_statuses} />
          </TableCellContent>
        ),
      },
      {
        id: "status",
        accessorKey: "status",
        header: () => "Статус",
        enableSorting: false,
        cell: ({ row }) => <ProductStatusBadge status={row.original.status} />,
      },
      {
        id: "supplier",
        accessorKey: "supplier_name",
        header: () => "Поставщик",
        cell: ({ row }) => (
          <div className="min-w-48 whitespace-normal text-muted-foreground">
            {row.original.supplier_name ?? "-"}
          </div>
        ),
      },
      {
        id: "buy_price",
        accessorKey: "buy_price",
        header: () => <div className="text-right">Закупка</div>,
        cell: ({ row }) => (
          <div className="text-right font-medium">{row.original.buy_price} ₼</div>
        ),
      },
      {
        id: "deal_price",
        header: () => <div className="text-right">Сделка</div>,
        cell: ({ row }) => (
          <div className="relative text-right">
            {row.original.current_sale ? (
              <div>
                <div className="font-medium">
                  {row.original.current_sale.total_price} ₼
                </div>
                <div className="text-xs text-emerald-600">
                  +{row.original.current_sale.profit} ₼
                </div>
              </div>
            ) : (
              <span className="text-muted-foreground">
                {formatProductDate(row.original.created_at)}
              </span>
            )}
          </div>
        ),
      },
      {
        id: "actions",
        header: () => <div className="sr-only">Действия</div>,
        enableSorting: false,
        cell: ({ row }) => (
          <div
            className="flex items-center justify-end gap-2"
            onClick={(event) => event.stopPropagation()}
          >
            {row.original.status === "in_stock" ? (
              <SellProductByIdDialog
                productId={row.original.id}
                trigger={
                  <Button type="button" size="sm">
                    Продать
                  </Button>
                }
              />
            ) : (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  navigate(`/products/${row.original.id}`, {
                    state: { from: returnTo },
                  })
                }
              >
                Детали
              </Button>
            )}
            <ProductActionsMenu
              product={row.original}
              returnTo={returnTo}
              compact
            />
          </div>
        ),
      },
    ],
    [navigate, returnTo],
  );
  const table = useReactTable({
    data: products,
    columns,
    state: { sorting },
    manualSorting: true,
    getCoreRowModel: getCoreRowModel(),
  });

  function handleSort(field: (typeof productSortFields)[number]) {
    if (sortBy !== field) {
      onSortChange(field, field === "name" || field === "supplier" ? "asc" : "desc");
      return;
    }
    if (sortDir === "asc") {
      onSortChange(field, "desc");
      return;
    }
    onSortChange(null, null);
  }

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id}>
                {header.isPlaceholder ? null : header.column.id === "actions" ? (
                  flexRender(header.column.columnDef.header, header.getContext())
                ) : !header.column.getCanSort() ? (
                  flexRender(header.column.columnDef.header, header.getContext())
                ) : (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 font-bold"
                    disabled={!header.column.getCanSort()}
                    onClick={() =>
                      header.column.getCanSort()
                        ? handleSort(header.column.id as (typeof productSortFields)[number])
                        : undefined
                    }
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    <SortIcon
                      state={
                        sortBy === header.column.id
                          ? sortDir ?? false
                          : false
                      }
                    />
                  </button>
                )}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow
            key={row.original.id}
            role="link"
            tabIndex={0}
            className="cursor-pointer"
            onClick={() =>
              navigate(`/products/${row.original.id}`, {
                state: { from: returnTo },
              })
            }
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                navigate(`/products/${row.original.id}`, {
                  state: { from: returnTo },
                });
              }
            }}
          >
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function SellProductByIdDialog({
  productId,
  trigger,
}: {
  productId: number;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const productQuery = useProductDetail(productId, open);

  if (!productQuery.data) {
    return (
      <ResponsiveModal
        open={open}
        onOpenChange={setOpen}
        trigger={trigger}
        title="Оформление продажи"
        description="Загружаем данные товара."
        className="md:max-w-lg"
      >
        <div className="py-8 text-center text-sm text-muted-foreground">
          Загрузка товара...
        </div>
      </ResponsiveModal>
    );
  }

  return (
    <SellProductDialog
      product={productQuery.data}
      open={open}
      onOpenChange={setOpen}
      trigger={trigger}
      onSold={(product: ProductDetail) => {
        queryClient.setQueryData(["products", product.id], product);
        queryClient.invalidateQueries({ queryKey: ["products"] });
      }}
    />
  );
}

function ProductActionsMenu({
  product,
  returnTo,
  compact = false,
}: {
  product: ProductListItem;
  returnTo: string;
  compact?: boolean;
}) {
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const deleteProduct = useDeleteProduct(product.id);

  async function copyImei() {
    await navigator.clipboard.writeText(product.imei);
    toast.success("IMEI скопирован");
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size={compact ? "icon" : "sm"}
            aria-label="Действия"
            onClick={(event) => event.stopPropagation()}
          >
            <MoreHorizontal aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          onClick={(event) => event.stopPropagation()}
        >
          <DropdownMenuItem
            onSelect={() =>
              navigate(`/products/${product.id}`, { state: { from: returnTo } })
            }
          >
            <Eye aria-hidden="true" />
            Детали
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() =>
              navigate(`/products/${product.id}/edit`, {
                state: { from: returnTo },
              })
            }
          >
            <Edit aria-hidden="true" />
            Редактировать
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={copyImei}>
            <Copy aria-hidden="true" />
            Скопировать IMEI
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setConfirmOpen(true)}
          >
            <Trash2 aria-hidden="true" />
            Удалить
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent onClick={(event) => event.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить товар?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить товар «{product.name}»?
              <span className="mt-2 block text-foreground">
                IMEI: {product.imei}
                {product.imei2 ? ` / ${product.imei2}` : ""}
              </span>
              {product.supplier_name ? (
                <span className="mt-1 block text-foreground">
                  Поставщик: {product.supplier_name}
                </span>
              ) : null}
              <span className="mt-2 block">
                Финансовые движения по покупке и продаже будут пересчитаны. Это действие нельзя отменить.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive/10 text-destructive hover:bg-destructive/20"
              onClick={() =>
                deleteProduct.mutate(undefined, {
                  onSuccess: () => {
                    queryClient.invalidateQueries({ queryKey: ["products"] });
                    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
                    queryClient.invalidateQueries({ queryKey: ["finance"] });
                    toast.success("Товар удалён");
                  },
                })
              }
            >
              Удалить товар
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function ProductsTableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 8 }).map((_, index) => (
        <Skeleton key={index} className="h-14 w-full" />
      ))}
    </div>
  );
}

function ProductsCardListSkeleton() {
  return (
    <div className="space-y-3 md:hidden">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="rounded-lg border bg-card p-4 shadow-sm">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="mt-2 h-4 w-1/2" />
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
          <Skeleton className="mt-3 h-12 w-full" />
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function TableCellContent({ children }: { children: ReactNode }) {
  return <div className="min-w-72">{children}</div>;
}

function SortIcon({ state }: { state: "asc" | "desc" | false }) {
  if (state === "asc") {
    return <ArrowUp className="size-4 text-primary" aria-hidden="true" />;
  }
  if (state === "desc") {
    return <ArrowDown className="size-4 text-primary" aria-hidden="true" />;
  }
  return <ChevronsUpDown className="size-4 text-muted-foreground" aria-hidden="true" />;
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName.toLowerCase();
  return (
    target.isContentEditable ||
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select"
  );
}
