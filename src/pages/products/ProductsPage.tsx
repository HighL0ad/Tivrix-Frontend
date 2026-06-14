import { type ReactNode, useEffect, useMemo, useState } from "react";
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
  ChevronDown,
} from "lucide-react";
import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";
import { NavLink, useNavigate } from "react-router";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import { useCurrentUser } from "@/entities/auth/api/use-current-user";
import { useDeleteProduct } from "@/entities/products/api/use-product-actions";
import { useProductCreateOptions } from "@/entities/products/api/use-product-create";
import { useProductDetail } from "@/entities/products/api/use-product-detail";
import { useProducts } from "@/entities/products/api/use-products";
import type {
  ProductDetail,
  ProductListItem,
  ProductStatus,
} from "@/entities/products/model/types";
import { registrationOptions } from "@/features/products/product-form/model";
import {
  formatProductDate,
  formatProductImei,
  formatProductSupplier,
  isLegacyInstallmentProduct,
} from "@/features/products/product-display/format";
import { saveProductsReturnLocation } from "@/features/products/product-return-location";
import { ProductStatusBadge } from "@/features/products/product-display/ProductStatusBadge";
import {
  LegacyInstallmentBadge,
  RegistrationBadges,
} from "@/features/products/product-display/RegistrationBadges";
import { SellProductDialog } from "@/features/products/sell-product/SellProductDialog";
import { getApiErrorMessage } from "@/shared/api/error";
import { queryClient } from "@/shared/api/query-client";
import { eventStartedInInteractiveElement } from "@/shared/lib/events";
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
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { HighlightText } from "@/shared/ui/highlight-text";
import { Card, CardContent, CardHeader } from "@/shared/ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Input } from "@/shared/ui/input";
import { Money } from "@/shared/ui/money-display";
import { EmptyState } from "@/shared/ui/empty-state";
import { PageHeader } from "@/shared/ui/page-header";
import {
  PaginationBar,
} from "@/shared/ui/pagination";
import { Skeleton } from "@/shared/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { ScrollArea } from "@/shared/ui/scroll-area";

const statusFilters: Array<{ value: ProductStatus | "all"; labelKey: string }> = [
  { value: "all", labelKey: "common.all" },
  { value: "in_stock", labelKey: "products.status.in_stock" },
  { value: "sold", labelKey: "products.status.soldPlural" },
  { value: "reserved", labelKey: "products.status.reserved" },
];
const productStatusValues = ["new", "in_stock", "sold", "reserved", "returned"] as const;
const registrationStatusValues = [
  "registered",
  "unregistered",
  "no_declaration",
  "own_property",
  "credit",
  "mismatch",
] as const;
const productSortFields = ["name", "supplier", "buy_price", "deal_price"] as const;
const sortDirections = ["asc", "desc"] as const;

export function ProductsPage() {
  const { t } = useTranslation();
  const currentUserQuery = useCurrentUser();
  const isCreditEnabled = currentUserQuery.data?.credit_system_enabled ?? true;
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const filteredRegistrationOptions = useMemo(() => {
    return isCreditEnabled
      ? registrationOptions
      : registrationOptions.filter((option) => option.value !== "credit");
  }, [isCreditEnabled]);
  const [{ status, supplierIds, registrationStatuses, q, sortBy, sortDir, page }, setProductParams] = useQueryStates({
    status: parseAsStringLiteral(productStatusValues),
    supplierIds: parseAsString.withDefault(""),
    registrationStatuses: parseAsString.withDefault(""),
    q: parseAsString.withDefault(""),
    sortBy: parseAsStringLiteral(productSortFields),
    sortDir: parseAsStringLiteral(sortDirections),
    page: parseAsInteger.withDefault(1),
  }, { scroll: false });
  const activeStatus = status ?? undefined;
  const activeSupplierIds = useMemo(
    () => supplierIds.split(",").filter(Boolean),
    [supplierIds],
  );
  const activeRegistrationStatuses = useMemo(
    () =>
      registrationStatuses
        .split(",")
        .filter((value): value is (typeof registrationStatusValues)[number] =>
          registrationStatusValues.includes(value as (typeof registrationStatusValues)[number]),
        ),
    [registrationStatuses],
  );
  const [searchValue, setSearchValue] = useState(q);
  const debouncedSearchValue = useDebouncedValue(searchValue, 300);
  const [supplierSearch, setSupplierSearch] = useState("");
  const createOptionsQuery = useProductCreateOptions();
  const productsQuery = useProducts({
    status: activeStatus,
    supplierIds: activeSupplierIds.length ? activeSupplierIds : undefined,
    registrationStatuses: activeRegistrationStatuses.length
      ? activeRegistrationStatuses
      : undefined,
    q,
    sortBy: sortBy ?? undefined,
    sortDir: sortDir ?? undefined,
    page,
  });
  const products = productsQuery.data;
  const supplierOptions = useMemo(
    () => {
      const options =
        createOptionsQuery.data?.purchase_source_options ??
        createOptionsQuery.data?.supplier_wallet_options ??
        [];
      return options.map((supplier) => ({
        id: supplier.id,
        name: supplier.name,
      }));
    },
    [
      createOptionsQuery.data?.purchase_source_options,
      createOptionsQuery.data?.supplier_wallet_options,
    ],
  );
  const selectedSuppliers = useMemo(
    () => supplierOptions.filter((supplier) => activeSupplierIds.includes(supplier.id)),
    [activeSupplierIds, supplierOptions],
  );
  const visibleSupplierOptions = useMemo(() => {
    const normalizedSearch = supplierSearch.trim().toLowerCase();
    if (!normalizedSearch) return supplierOptions;
    return supplierOptions.filter((supplier) =>
      supplier.name.toLowerCase().includes(normalizedSearch),
    );
  }, [supplierOptions, supplierSearch]);

  useEffect(() => {
    setSearchValue(q);
  }, [q]);

  function updateParams(next: {
    status?: ProductStatus | "all";
    supplierIds?: string[];
    registrationStatuses?: string[];
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
      supplierIds:
        next.supplierIds === undefined
          ? supplierIds
          : next.supplierIds.join(","),
      registrationStatuses:
        next.registrationStatuses === undefined
          ? registrationStatuses
          : next.registrationStatuses.join(","),
      q: next.q === undefined ? q : next.q.trim(),
      sortBy: next.sortBy === undefined ? sortBy : next.sortBy,
      sortDir: next.sortDir === undefined ? sortDir : next.sortDir,
      page:
        next.status !== undefined ||
        next.supplierIds !== undefined ||
        next.registrationStatuses !== undefined ||
        next.q !== undefined ||
        next.sortBy !== undefined ||
        next.sortDir !== undefined
          ? 1
          : next.page,
    });
  }

  useEffect(() => {
    const nextQuery = debouncedSearchValue.trim();
    if (nextQuery !== searchValue.trim()) {
      return;
    }
    if (nextQuery !== q) {
      setProductParams({ q: nextQuery, page: 1 });
    }
  }, [debouncedSearchValue, q, searchValue, setProductParams]);

  const returnTo = useMemo(() => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (supplierIds) params.set("supplierIds", supplierIds);
    if (registrationStatuses) params.set("registrationStatuses", registrationStatuses);
    if (q) params.set("q", q);
    if (sortBy) params.set("sortBy", sortBy);
    if (sortDir) params.set("sortDir", sortDir);
    if (page > 1) params.set("page", String(page));

    const query = params.toString();
    return query ? `/products?${query}` : "/products";
  }, [page, q, registrationStatuses, sortBy, sortDir, status, supplierIds]);

  useEffect(() => {
    saveProductsReturnLocation(returnTo);
  }, [returnTo]);

  return (
    <section className="space-y-5">
      <PageHeader
        title={t("app.nav.products")}
        description={products ? t("products.total", { count: products.total }) : t("products.loading")}
        actions={
        <Button asChild>
          <NavLink to="/products/new" state={{ from: returnTo }}>
            <Plus aria-hidden="true" />
            {t("app.addProduct")}
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
                  {t(filter.labelKey)}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                className="pl-9"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder={t("products.searchPlaceholder")}
              />
            </div>
            {q ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSearchValue("");
                }}
              >
                {t("common.reset")}
              </Button>
            ) : null}
          </div>

          <div className="grid gap-2 sm:grid-cols-[minmax(0,260px)_minmax(0,260px)_auto]">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 justify-between rounded-lg border-border bg-background px-3 font-medium shadow-none"
                >
                  <span className="truncate">
                    {selectedSuppliers.length
                      ? t("products.suppliersSelected", { count: selectedSuppliers.length })
                      : t("products.allSuppliers")}
                  </span>
                  <ChevronDown className="size-4 text-muted-foreground" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-72">
                <div className="p-1">
                  <div className="relative">
                    <Search
                      className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <Input
                      value={supplierSearch}
                      onChange={(event) => setSupplierSearch(event.target.value)}
                      placeholder={t("products.supplierSearch")}
                      className="h-9 pl-8"
                    />
                  </div>
                </div>
                <DropdownMenuSeparator />
                <ScrollArea className="max-h-64">
                {visibleSupplierOptions.length ? visibleSupplierOptions.map((supplier) => {
                  const checked = activeSupplierIds.includes(supplier.id);
                  return (
                    <DropdownMenuCheckboxItem
                      key={supplier.id}
                      checked={checked}
                      onCheckedChange={(nextChecked) => {
                        const nextIds = nextChecked
                          ? [...activeSupplierIds, supplier.id]
                          : activeSupplierIds.filter((id) => id !== supplier.id);
                        updateParams({ supplierIds: nextIds });
                      }}
                      onSelect={(event) => event.preventDefault()}
                    >
                      <span className="truncate">{supplier.name}</span>
                    </DropdownMenuCheckboxItem>
                  );
                }) : (
                  <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                    {t("products.supplierNotFound")}
                  </div>
                )}
                </ScrollArea>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 justify-between rounded-lg border-border bg-background px-3 font-medium shadow-none"
                >
                  <span className="truncate">
                    {activeRegistrationStatuses.length
                      ? t("products.registrationSelected", {
                          count: activeRegistrationStatuses.length,
                        })
                      : t("products.allRegistrationStatuses")}
                  </span>
                  <ChevronDown className="size-4 text-muted-foreground" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-72">
                <ScrollArea className="max-h-64">
                  {filteredRegistrationOptions.map((option) => {
                    const checked = activeRegistrationStatuses.includes(
                      option.value as (typeof registrationStatusValues)[number],
                    );
                    return (
                      <DropdownMenuCheckboxItem
                        key={option.value}
                        checked={checked}
                        onCheckedChange={(nextChecked) => {
                          const nextStatuses = nextChecked
                            ? [...activeRegistrationStatuses, option.value]
                            : activeRegistrationStatuses.filter(
                                (statusValue) => statusValue !== option.value,
                              );
                          updateParams({ registrationStatuses: nextStatuses });
                        }}
                        onSelect={(event) => event.preventDefault()}
                      >
                        <span className="truncate">{t(option.labelKey)}</span>
                      </DropdownMenuCheckboxItem>
                    );
                  })}
                </ScrollArea>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {(activeStatus || activeSupplierIds.length || activeRegistrationStatuses.length || q) ? (
            <div className="flex flex-wrap items-center gap-2 pt-2 animate-in fade-in slide-in-from-top-1 duration-200">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mr-1">
                {t("common.filters")}:
              </span>
              {activeStatus ? (
                <Badge variant="secondary" className="gap-1 pl-2 pr-1 h-7 rounded-md">
                  {t(statusFilters.find(f => f.value === activeStatus)?.labelKey ?? "")}
                  <button
                    onClick={() => updateParams({ status: "all" })}
                    className="rounded-sm p-0.5 hover:bg-muted-foreground/20 transition-colors"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ) : null}
              {selectedSuppliers.map((supplier) => (
                <Badge key={supplier.id} variant="secondary" className="gap-1 pl-2 pr-1 h-7 rounded-md">
                  {supplier.name}
                  <button
                    onClick={() =>
                      updateParams({
                        supplierIds: activeSupplierIds.filter((id) => id !== supplier.id),
                      })
                    }
                    className="rounded-sm p-0.5 hover:bg-muted-foreground/20 transition-colors"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
              {activeRegistrationStatuses.map((registrationStatus) => {
                const option = registrationOptions.find(
                  (item) => item.value === registrationStatus,
                );
                return (
                  <Badge key={registrationStatus} variant="secondary" className="gap-1 pl-2 pr-1 h-7 rounded-md">
                    {t(option?.labelKey ?? `products.registrationStatus.${registrationStatus}`)}
                    <button
                      onClick={() =>
                        updateParams({
                          registrationStatuses: activeRegistrationStatuses.filter(
                            (statusValue) => statusValue !== registrationStatus,
                          ),
                        })
                      }
                      className="rounded-sm p-0.5 hover:bg-muted-foreground/20 transition-colors"
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                );
              })}
              {q ? (
                <Badge variant="secondary" className="gap-1 pl-2 pr-1 h-7 rounded-md font-mono">
                  "{q}"
                  <button
                    onClick={() => {
                      setSearchValue("");
                      updateParams({ q: "" });
                    }}
                    className="rounded-sm p-0.5 hover:bg-muted-foreground/20 transition-colors"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ) : null}
              <Button
                variant="outline"
                size="sm"
                className="h-7 rounded-md border-rose-200 bg-background px-3 text-[12px] font-semibold text-rose-700 shadow-none hover:bg-rose-50 hover:text-rose-800 dark:border-rose-400/35 dark:bg-rose-500/10 dark:text-rose-200 dark:hover:bg-rose-500/18 dark:hover:text-rose-100"
                onClick={() => {
                  setSearchValue("");
                  setSupplierSearch("");
                  setProductParams({
                    status: null,
                    supplierIds: "",
                    registrationStatuses: "",
                    q: "",
                    sortBy: null,
                    sortDir: null,
                    page: 1,
                  });
                }}
              >
                {t("common.reset")}
              </Button>
            </div>
          ) : null}
        </CardHeader>

        <CardContent>
          {productsQuery.isPending && !productsQuery.data ? (
            isDesktop ? <ProductsTableSkeleton /> : <ProductsCardListSkeleton />
          ) : (
            <div className={productsQuery.isFetching ? "opacity-60 transition-opacity duration-200" : "transition-opacity duration-200"}>
              {products && products.items.length > 0 ? (
                isDesktop ? (
                  <ProductsTable
                    products={products.items}
                    returnTo={returnTo}
                    sortBy={sortBy ?? null}
                    sortDir={sortDir ?? null}
                    onSortChange={(nextSortBy, nextSortDir) =>
                      updateParams({ sortBy: nextSortBy, sortDir: nextSortDir })
                    }
                    q={q ?? ""}
                  />
                ) : (
                  <ProductsCardList
                    products={products.items}
                    returnTo={returnTo}
                    q={q ?? ""}
                  />
                )
              ) : (
                <EmptyState
                  title={t("products.emptyTitle")}
                  description={
                    q || activeSupplierIds.length || activeRegistrationStatuses.length || activeStatus
                      ? t("products.emptyFilteredDescription")
                      : t("products.emptyDescription")
                  }
                  action={
                    q || activeSupplierIds.length || activeRegistrationStatuses.length || activeStatus ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setSearchValue("");
                          setSupplierSearch("");
                          setProductParams({
                            status: null,
                            supplierIds: "",
                            registrationStatuses: "",
                            q: "",
                            sortBy: null,
                            sortDir: null,
                            page: 1,
                          });
                        }}
                      >
                        {t("common.resetFilters")}
                      </Button>
                    ) : (
                      <Button asChild>
                        <NavLink to="/products/new" state={{ from: returnTo }}>
                          <Plus aria-hidden="true" />
                          {t("products.addFirst")}
                        </NavLink>
                      </Button>
                    )
                  }
                />
              )}

              {products ? (
                <PaginationBar
                  page={products.page}
                  totalPages={products.total_pages}
                  total={products.total}
                  onPageChange={(nextPage) => updateParams({ page: nextPage })}
                />
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function ProductsCardList({
  products,
  returnTo,
  q,
}: {
  products: ProductListItem[];
  returnTo: string;
  q: string;
}) {
  const { t } = useTranslation();
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
        const isLegacyInstallment = isLegacyInstallmentProduct(product);

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
                    <div className="break-words font-bold text-foreground">
                      <HighlightText text={product.name} highlight={q} />
                    </div>
                    <div className="mt-1 font-mono text-xs text-muted-foreground">
                      <HighlightText text={formatProductImei(product)} highlight={q} />
                    </div>
                  </div>
                  <ProductStatusBadge status={product.status} />
                </div>

                {isLegacyInstallment ? (
                  <div className="mt-2">
                    <LegacyInstallmentBadge />
                  </div>
                ) : (
                  <RegistrationBadges statuses={product.registration_statuses} />
                )}

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-xs font-bold uppercase text-muted-foreground">
                      {t("catalogs.suppliers")}
                    </div>
                    <div className="mt-1 break-words font-semibold">
                      {formatProductSupplier(product)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold uppercase text-muted-foreground">
                      {t("sell.purchase")}
                    </div>
                    <div className="mt-1 font-black">
                      <Money value={product.buy_price} />
                    </div>
                  </div>
                </div>

                <div className="mt-3 rounded-lg bg-muted px-3 py-2 text-sm">
                  {product.current_sale ? (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">{t("products.deal")}</span>
                        <span className="font-black text-foreground">
                          <Money value={product.current_sale.total_price} />
                          <Money
                            value={product.current_sale.profit}
                            signed
                            colored
                            className="ml-2"
                          />
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <span className="text-muted-foreground">{t("products.soldAt")}</span>
                        <span className="font-semibold">
                          {formatProductDate(product.current_sale.sold_at)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">{t("products.createdAt")}</span>
                      <span className="font-semibold">
                        {formatProductDate(product.created_at)}
                      </span>
                    </div>
                  )}
                </div>
              </button>

              <div className="border-t bg-background/70 p-3">
                {product.status === "in_stock" && !isLegacyInstallment ? (
                  <div className="grid grid-cols-[1fr_auto] gap-2">
                    <SellProductByIdDialog
                      productId={product.id}
                      trigger={
                        <Button type="button" className="w-full">
                          {t("sell.sell")}
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
                  <div
                    className={
                      isLegacyInstallment
                        ? "grid gap-2"
                        : "grid grid-cols-2 gap-2"
                    }
                  >
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        navigate(`/products/${product.id}`, {
                          state: { from: returnTo },
                        })
                      }
                    >
                      {t("common.details")}
                    </Button>
                    {!isLegacyInstallment ? (
                      <Button asChild type="button" variant="outline">
                        <NavLink
                          to={`/products/${product.id}/edit`}
                          state={{ from: returnTo }}
                        >
                          {t("common.edit")}
                        </NavLink>
                      </Button>
                    ) : null}
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
  q,
}: {
  products: ProductListItem[];
  returnTo: string;
  sortBy: (typeof productSortFields)[number] | null;
  sortDir: (typeof sortDirections)[number] | null;
  onSortChange: (
    sortBy: (typeof productSortFields)[number] | null,
    sortDir: (typeof sortDirections)[number] | null,
  ) => void;
  q: string;
}) {
  const { t } = useTranslation();
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
        header: () => t("sell.product"),
        cell: ({ row }) => (
          <TableCellContent>
            <div className="font-medium text-foreground">
              <HighlightText text={row.original.name} highlight={q ?? ""} />
            </div>
            <div className="mt-1 font-mono text-xs text-muted-foreground">
              <HighlightText text={formatProductImei(row.original)} highlight={q ?? ""} />
            </div>
            {isLegacyInstallmentProduct(row.original) ? (
              <div className="mt-2">
                <LegacyInstallmentBadge />
              </div>
            ) : (
              <RegistrationBadges statuses={row.original.registration_statuses} />
            )}
          </TableCellContent>
        ),
      },
      {
        id: "status",
        accessorKey: "status",
        header: () => t("common.status"),
        enableSorting: false,
        cell: ({ row }) => <ProductStatusBadge status={row.original.status} />,
      },
      {
        id: "supplier",
        accessorKey: "supplier_name",
        header: () => t("catalogs.suppliers"),
        cell: ({ row }) => (
          <div className="min-w-48 whitespace-normal text-muted-foreground">
            {formatProductSupplier(row.original)}
          </div>
        ),
      },
      {
        id: "buy_price",
        accessorKey: "buy_price",
        header: () => <div className="text-right">{t("sell.purchase")}</div>,
        cell: ({ row }) => (
          <div className="text-right font-medium">
            <Money value={row.original.buy_price} />
          </div>
        ),
      },
      {
        id: "deal_price",
        header: () => <div className="text-right">{t("products.deal")}</div>,
        cell: ({ row }) => (
          <div className="relative text-right">
            {row.original.current_sale ? (
              <div>
                <div className="font-medium text-foreground">
                  <Money value={row.original.current_sale.total_price} />
                </div>
                <div>
                  <Money
                    value={row.original.current_sale.profit}
                    signed
                    colored
                    className="text-xs"
                  />
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {t("products.soldWithColon", {
                    date: formatProductDate(row.original.current_sale.sold_at),
                  })}
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
        header: () => <div className="sr-only">{t("common.actions")}</div>,
        enableSorting: false,
        cell: ({ row }) => (
          <div
            className="flex items-center justify-end gap-2"
            onClick={(event) => event.stopPropagation()}
          >
            {row.original.status === "in_stock" &&
            !isLegacyInstallmentProduct(row.original) ? (
              <SellProductByIdDialog
                productId={row.original.id}
                trigger={
                  <Button type="button" size="sm">
                    {t("sell.sell")}
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
                {t("common.details")}
              </Button>
            )}
            {!isLegacyInstallmentProduct(row.original) ? (
              <ProductActionsMenu
                product={row.original}
                returnTo={returnTo}
                compact
              />
            ) : null}
          </div>
        ),
      },
    ],
    [navigate, returnTo, t],
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
    <>
      <Table className="hidden md:table">
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
              onClick={(event) => {
                if (eventStartedInInteractiveElement(event.nativeEvent)) {
                  return;
                }
                navigate(`/products/${row.original.id}`, {
                  state: { from: returnTo },
                });
              }}
              onKeyDown={(event) => {
                if (eventStartedInInteractiveElement(event.nativeEvent)) {
                  return;
                }
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

      {/* Mobile Product Card List */}
      <div className="grid gap-3 md:hidden">
        {table.getRowModel().rows.map((row) => {
          const prod = row.original;
          const isLegacyInstallment = isLegacyInstallmentProduct(prod);
          return (
            <div
              key={prod.id}
              className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-3 cursor-pointer"
              onClick={(event) => {
                if (eventStartedInInteractiveElement(event.nativeEvent)) {
                  return;
                }
                navigate(`/products/${prod.id}`, {
                  state: { from: returnTo },
                });
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-semibold text-foreground text-sm leading-snug">
                    {prod.name}
                  </div>
                  <div className="text-[11px] font-mono text-muted-foreground mt-1">
                    {formatProductImei(prod)}
                  </div>
                </div>
                <div className="shrink-0">
                  <ProductStatusBadge status={prod.status} />
                </div>
              </div>

              {isLegacyInstallment ? (
                <LegacyInstallmentBadge />
              ) : prod.registration_statuses?.length ? (
                <RegistrationBadges statuses={prod.registration_statuses} />
              ) : null}

              <div className="grid grid-cols-2 gap-2 border-y border-border/50 py-2.5 text-xs">
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                    {t("sell.purchase")}
                  </span>
                  <span className="font-medium text-foreground">
                    <Money value={prod.buy_price} />
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                    {prod.current_sale ? t("products.deal") : t("finance.date")}
                  </span>
                  {prod.current_sale ? (
                    <div>
                      <div className="font-medium text-foreground">
                        <Money value={prod.current_sale.total_price} />
                      </div>
                      <div>
                        <Money
                          value={prod.current_sale.profit}
                          signed
                          colored
                          className="text-[11px]"
                        />
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {t("products.soldWithColon", {
                          date: formatProductDate(prod.current_sale.sold_at),
                        })}
                      </div>
                    </div>
                  ) : (
                    <span className="font-medium text-foreground">
                      {formatProductDate(prod.created_at)}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 text-xs">
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                    {t("catalogs.suppliers")}
                  </span>
                  <span className="text-muted-foreground font-medium truncate block">
                    {formatProductSupplier(prod)}
                  </span>
                </div>
              </div>

              <div
                className="flex items-center justify-end gap-2 border-t border-border/50 pt-3"
                onClick={(event) => event.stopPropagation()}
              >
                {prod.status === "in_stock" ? (
                  <SellProductByIdDialog
                    productId={prod.id}
                    trigger={
                      <Button type="button" size="sm">
                        {t("sell.sell")}
                      </Button>
                    }
                  />
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      navigate(`/products/${prod.id}`, {
                        state: { from: returnTo },
                      })
                    }
                  >
                    {t("common.details")}
                  </Button>
                )}
                {!isLegacyInstallment ? (
                  <ProductActionsMenu
                    product={prod}
                    returnTo={returnTo}
                    compact
                  />
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function SellProductByIdDialog({
  productId,
  trigger,
}: {
  productId: number;
  trigger: React.ReactNode;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const productQuery = useProductDetail(productId, open);

  if (!productQuery.data) {
    return (
      <ResponsiveModal
        open={open}
        onOpenChange={setOpen}
        trigger={trigger}
        title={t("sell.title")}
        description={t("products.loadingProductDescription")}
        className="md:max-w-lg"
      >
        <div className="py-8 text-center text-sm text-muted-foreground">
          {t("products.loadingProduct")}
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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const deleteProduct = useDeleteProduct(product.id);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");

  const handleOpenConfirmChange = (open: boolean) => {
    setConfirmOpen(open);
    if (!open) {
      setDeleteConfirmName("");
    }
  };

  async function copyImei(value: string) {
    await navigator.clipboard.writeText(value);
    toast.info(t("products.imeiCopied"));
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size={compact ? "icon" : "sm"}
            aria-label={t("common.actions")}
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
            {t("common.details")}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() =>
              navigate(`/products/${product.id}/edit`, {
                state: { from: returnTo },
              })
            }
          >
            <Edit aria-hidden="true" />
            {t("common.edit")}
          </DropdownMenuItem>
          {product.imei2 ? (
            <>
              <DropdownMenuItem onSelect={() => copyImei(product.imei)}>
                <Copy aria-hidden="true" />
                {t("products.copyImeiNumber", { number: 1 })}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => copyImei(product.imei2 || "")}>
                <Copy aria-hidden="true" />
                {t("products.copyImeiNumber", { number: 2 })}
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => copyImei([product.imei, product.imei2].join("\n"))}
              >
                <Copy aria-hidden="true" />
                {t("debts.copyAllImeis")}
              </DropdownMenuItem>
            </>
          ) : (
            <DropdownMenuItem onSelect={() => copyImei(product.imei)}>
              <Copy aria-hidden="true" />
              {t("products.copyImei")}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setConfirmOpen(true)}
          >
            <Trash2 aria-hidden="true" />
            {t("common.delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ResponsiveModal
        open={confirmOpen}
        onOpenChange={handleOpenConfirmChange}
        title={t("products.deleteTitle")}
        className="md:max-w-md"
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end w-full" onClick={(event) => event.stopPropagation()}>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenConfirmChange(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={
                deleteConfirmName.trim().toLowerCase() !== product.name.trim().toLowerCase() ||
                deleteProduct.isPending
              }
              onClick={() =>
                deleteProduct.mutate(undefined, {
                  onSuccess: () => {
                    queryClient.invalidateQueries({ queryKey: ["products"] });
                    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
                    queryClient.invalidateQueries({ queryKey: ["finance"] });
                    toast.warning(t("products.deleted"));
                  },
                  onError: (error) => toast.error(getApiErrorMessage(error)),
                })
              }
            >
              {t("products.deleteAction")}
            </Button>
          </div>
        }
      >
        <div className="space-y-4" onClick={(event) => event.stopPropagation()}>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              {t("products.deleteDescription", { name: product.name })}
            </p>
            <div className="border-l-2 border-border pl-3 space-y-1 my-2">
              <span className="block text-xs font-semibold text-foreground">
                {formatProductImei(product)}
              </span>
              {product.supplier_name ? (
                <span className="block text-xs text-muted-foreground">
                  {t("products.supplierWithColon", { name: product.supplier_name })}
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
              <span className="font-bold text-foreground select-all">{product.name}</span>
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
  );
}

function ProductsTableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="flex h-14 w-full items-center gap-4 border-b px-4">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

function ProductsCardListSkeleton() {
  return (
    <div className="space-y-4 md:hidden">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-lg border bg-card shadow-sm">
          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <div className="mt-3 flex gap-1">
              <Skeleton className="h-4 w-12 rounded-full" />
              <Skeleton className="h-4 w-12 rounded-full" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-4 w-full" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
            <Skeleton className="mt-3 h-10 w-full rounded-lg" />
          </div>
          <div className="border-t bg-background/70 p-3">
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

function TableCellContent({ children }: { children: ReactNode }) {
  return <div className="min-w-72">{children}</div>;
}

function useDebouncedValue(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timeout);
  }, [delay, value]);

  return debouncedValue;
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
