import { useEffect, useState } from "react";
import {
  ArrowLeftRight,
  Boxes,
  Database,
  Gauge,
  HandCoins,
  History,
  Plus,
  Receipt,
  Search,
  Users,
  Wallet,
} from "lucide-react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";

import { useGlobalSearch } from "@/entities/search/api/use-global-search";
import { money, shortDate } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";
import { walletTypeLabel } from "@/shared/lib/wallet-labels";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/shared/ui/command";

export function CommandMenuTrigger({
  onClick,
  className,
  kbdClassName,
  showLabel = true,
}: {
  onClick: () => void;
  className?: string;
  kbdClassName?: string;
  showLabel?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 transition-colors",
        className
      )}
    >
      <Search className="size-4 shrink-0" />
      {showLabel && <span className="flex-1 text-left truncate">{t("common.search")}</span>}
      <kbd className={cn("pointer-events-none hidden h-5 select-none items-center gap-1 rounded px-1.5 font-mono text-[10px] font-medium sm:flex shrink-0", kbdClassName)}>
        <span className="text-xs">⌘</span>K
      </kbd>
    </button>
  );
}

export function CommandMenuDialog({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const normalizedSearch = search.trim();
  const globalSearch = useGlobalSearch(debouncedSearch);
  const hasGlobalQuery = normalizedSearch.length >= 2;
  const products = globalSearch.data?.products ?? [];
  const transactions = globalSearch.data?.transactions ?? [];
  const wallets = globalSearch.data?.wallets ?? [];
  const hasGlobalResults =
    products.length > 0 || transactions.length > 0 || wallets.length > 0;

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(true);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [setOpen]);

  const runCommand = (command: () => void) => {
    setOpen(false);
    setSearch("");
    command();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        value={search}
        onValueChange={setSearch}
        placeholder={t("common.search")}
      />
      <CommandList>
        <CommandEmpty>
          {hasGlobalQuery && globalSearch.isFetching
            ? t("common.loading")
            : t("common.noResults")}
        </CommandEmpty>
        {hasGlobalQuery && globalSearch.isFetching ? (
          <CommandGroup heading={t("search.global")}>
            <CommandItem disabled value={`${normalizedSearch} loading`}>
              <Search className="mr-2 h-4 w-4" />
              <span>{t("common.loading")}</span>
            </CommandItem>
          </CommandGroup>
        ) : null}
        {products.length ? (
          <CommandGroup heading={t("search.products")}>
            {products.map((product) => (
              <CommandItem
                key={product.id}
                value={[
                  product.name,
                  product.imei,
                  product.imei2,
                  product.supplier_name,
                  product.status,
                ].filter(Boolean).join(" ")}
                onSelect={() => runCommand(() => navigate(`/products/${product.id}`))}
              >
                <Boxes className="mr-2 h-4 w-4" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{product.name}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {[
                      product.imei,
                      t(`products.status.${product.status}`, { defaultValue: product.status }),
                      product.supplier_name,
                      money(product.buy_price),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}
        {transactions.length ? (
          <CommandGroup heading={t("search.transactions")}>
            {transactions.map((transaction) => (
              <CommandItem
                key={transaction.id}
                value={[
                  transaction.description,
                  transaction.product_name,
                  transaction.from_wallet_name,
                  transaction.to_wallet_name,
                  transaction.amount,
                ].filter(Boolean).join(" ")}
                onSelect={() =>
                  runCommand(() =>
                    navigate(`/finance?tab=history&q=${encodeURIComponent(normalizedSearch)}`)
                  )
                }
              >
                <Receipt className="mr-2 h-4 w-4" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">
                    {transaction.display_description}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {[
                      money(transaction.amount),
                      transaction.product_name,
                      transaction.from_wallet_name && transaction.to_wallet_name
                        ? `${transaction.from_wallet_name} -> ${transaction.to_wallet_name}`
                        : transaction.from_wallet_name ?? transaction.to_wallet_name,
                      shortDate(transaction.created_at),
                    ].filter(Boolean).join(" · ")}
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}
        {wallets.length ? (
          <CommandGroup heading={t("search.wallets")}>
            {wallets.map((wallet) => (
              <CommandItem
                key={wallet.id}
                value={[wallet.name, wallet.type, wallet.balance].join(" ")}
                onSelect={() =>
                  runCommand(() =>
                    navigate(
                      `/catalogs?tab=${getWalletTab(wallet.type)}&search=${encodeURIComponent(wallet.name)}`
                    )
                  )
                }
              >
                <Wallet className="mr-2 h-4 w-4" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{wallet.name}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {[walletTypeLabel(wallet.type), money(wallet.balance)].join(" · ")}
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}
        {hasGlobalQuery && hasGlobalResults ? <CommandSeparator /> : null}
        <CommandGroup heading={t("common.actions")}>
          <CommandItem onSelect={() => runCommand(() => navigate("/products/new"))}>
            <Plus className="mr-2 h-4 w-4" />
            <span>{t("app.addProduct")}</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/finance?action=transfer"))}>
            <ArrowLeftRight className="mr-2 h-4 w-4" />
            <span>{t("finance.transfer")}</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/finance?action=adjust"))}>
            <Receipt className="mr-2 h-4 w-4" />
            <span>{t("finance.incomeExpense")}</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/catalogs"))}>
            <Database className="mr-2 h-4 w-4" />
            <span>{t("catalogs.createRecord")}</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/debts?action=borrow"))}>
            <HandCoins className="mr-2 h-4 w-4" />
            <span>{t("debts.borrow")}</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/debts?action=lend"))}>
            <HandCoins className="mr-2 h-4 w-4" />
            <span>{t("debts.lend")}</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading={t("common.sections")}>
          <CommandItem onSelect={() => runCommand(() => navigate("/"))}>
            <Gauge className="mr-2 h-4 w-4" />
            <span>{t("app.nav.dashboard")}</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/products"))}>
            <Boxes className="mr-2 h-4 w-4" />
            <span>{t("app.nav.products")}</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/finance"))}>
            <Wallet className="mr-2 h-4 w-4" />
            <span>{t("app.nav.finance")}</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/debts"))}>
            <HandCoins className="mr-2 h-4 w-4" />
            <span>{t("app.nav.debts")}</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/catalogs"))}>
            <Database className="mr-2 h-4 w-4" />
            <span>{t("app.nav.catalogs")}</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/users"))}>
            <Users className="mr-2 h-4 w-4" />
            <span>{t("app.nav.users")}</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/finance?tab=history"))}>
            <History className="mr-2 h-4 w-4" />
            <span>{t("finance.history")}</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

function useDebouncedValue(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timeout);
  }, [delay, value]);

  return debouncedValue;
}

function getWalletTab(type: string) {
  const normalizedType = type.toLowerCase().split(".").pop() ?? type.toLowerCase();
  if (["cash", "card", "bank_account"].includes(normalizedType)) {
    return "wallets";
  }
  if (normalizedType === "client_debt") {
    return "clients";
  }
  if (["debt", "debt_supplier", "shop", "partner", "supplier"].includes(normalizedType)) {
    return "suppliers";
  }
  return "advanced";
}
