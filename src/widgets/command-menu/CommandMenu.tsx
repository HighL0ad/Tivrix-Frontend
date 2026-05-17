import { useEffect } from "react";
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

import { cn } from "@/shared/lib/utils";
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
    command();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder={t("common.search")} />
      <CommandList>
        <CommandEmpty>{t("common.noResults")}</CommandEmpty>
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
