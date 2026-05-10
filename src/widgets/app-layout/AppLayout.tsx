import { useState } from "react";
import { NavLink, Outlet } from "react-router";
import {
  Banknote,
  Boxes,
  Database,
  Gauge,
  HandCoins,
  LogOut,
  Menu,
  Plus,
  Users,
} from "lucide-react";

import { useCurrentUser } from "@/entities/auth/api/use-current-user";
import { logout } from "@/entities/auth/api/logout";
import type { AppResourceKey } from "@/entities/auth/model/types";
import { queryClient } from "@/shared/api/query-client";
import { Button } from "@/shared/ui/button";
import { buttonVariants } from "@/shared/ui/button-variants";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/ui/sheet";
import { cn } from "@/shared/lib/utils";

const navItems = [
  { to: "/", label: "Главная", icon: Gauge, resource: "dashboard" },
  { to: "/products", label: "Товары", icon: Boxes, resource: "products" },
  { to: "/finance", label: "Касса", icon: Banknote, resource: "finance" },
  { to: "/debts", label: "Долги", icon: HandCoins, resource: "debts" },
  { to: "/catalogs", label: "Справочники", icon: Database, resource: "catalogs" },
  { to: "/users", label: "Пользователи", icon: Users, adminOnly: true },
];

export function AppLayout() {
  const currentUserQuery = useCurrentUser();
  const currentUser = currentUserQuery.data;
  const visibleNavItems = navItems.filter((item) => {
    if (!currentUser) {
      return !item.adminOnly;
    }

    if (item.adminOnly) {
      return currentUser.is_admin;
    }

    return currentUser.permissions[item.resource as AppResourceKey];
  });

  async function handleLogout() {
    await logout();
    queryClient.removeQueries({ queryKey: ["auth"] });
    window.location.assign("/login");
  }

  return (
    <TooltipProvider>
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed z-40 hidden h-full w-64 flex-col border-r border-white/10 bg-[#0f172a] text-white md:flex">
        <NavLink to="/" className="block border-b border-white/10 px-5 py-5">
          <h1 className="text-xl font-black tracking-tight text-white">
            Ferdi <span className="text-xs font-bold text-slate-300">Telefon</span>
          </h1>
        </NavLink>

        <nav className="flex flex-1 flex-col gap-1.5 p-3">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  buttonVariants({ variant: "ghost" }),
                  "h-10 justify-start gap-3 px-3 text-sm font-semibold shadow-none",
                  isActive
                    ? "bg-indigo-500/15 text-indigo-100 ring-1 ring-indigo-400/20"
                    : "text-slate-300 hover:bg-indigo-500/10 hover:text-white",
                )
              }
            >
              <item.icon className="h-5 w-5" aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          ))}

          <div className="mt-3 border-t border-white/10 pt-3">
            <Button asChild className="w-full bg-[#4f46e5] hover:bg-indigo-500">
              <NavLink to="/products/new">
                <Plus aria-hidden="true" />
                Добавить товар
              </NavLink>
            </Button>
          </div>

          <div className="mt-auto space-y-2 pt-4">
            {currentUser ? (
              <div className="grid grid-cols-[1fr_auto] items-center gap-2 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-xs text-slate-300">
                <div className="min-w-0">
                  <div className="font-semibold text-white">
                    {currentUser.username}
                  </div>
                  <div className="mt-0.5 text-xs uppercase text-slate-400">
                    {currentUser.role}
                  </div>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      onClick={handleLogout}
                      variant="ghost"
                      size="icon"
                      className="text-slate-300 hover:bg-rose-500/15 hover:text-rose-200"
                      aria-label="Выйти"
                    >
                      <LogOut aria-hidden="true" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Выйти</TooltipContent>
                </Tooltip>
              </div>
            ) : (
              <div className="h-10 animate-pulse rounded-lg bg-white/10" />
            )}
          </div>
        </nav>
      </aside>

      <main className="w-full transition-all duration-300 md:pl-64">
        <div className="mx-auto max-w-md p-4 pb-24 md:max-w-7xl md:p-6 lg:p-8 md:pb-8">
          <header className="sticky top-2 z-30 mb-4 flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm md:hidden">
            <NavLink to="/" className="text-lg font-bold text-indigo-700">
              Ferdi Telefon
            </NavLink>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    onClick={handleLogout}
                    variant="ghost"
                    size="icon-sm"
                    className="rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    aria-label="Выйти"
                  >
                    <LogOut aria-hidden="true" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Выйти</TooltipContent>
              </Tooltip>
            </div>
          </header>

          <Outlet />
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 z-40 w-full border-t border-white/10 bg-[#0f172a] shadow-2xl md:hidden">
        <div className="mx-auto grid h-16 max-w-md grid-cols-5">
          {visibleNavItems.slice(0, 2).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                [
                  "flex w-full flex-col items-center justify-center text-[10px] font-medium",
                  isActive ? "text-indigo-200" : "text-slate-400",
                ].join(" ")
              }
            >
              <item.icon className="mb-0.5 h-6 w-6" aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          ))}
          <div className="relative -top-5 flex justify-center">
            <NavLink
              to="/products/new"
              className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#4f46e5] text-white shadow-lg shadow-indigo-950/40 transition-transform hover:scale-105 hover:bg-indigo-500"
              aria-label="Добавить товар"
            >
              <Plus className="h-8 w-8" aria-hidden="true" />
            </NavLink>
          </div>
          {visibleNavItems.slice(2, 3).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  "flex w-full flex-col items-center justify-center text-[10px] font-medium",
                  isActive ? "text-indigo-200" : "text-slate-400",
                ].join(" ")
              }
            >
              <item.icon className="mb-0.5 h-6 w-6" aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          ))}
          <MobileMoreMenu
            items={visibleNavItems.slice(3)}
            onLogout={handleLogout}
          />
        </div>
      </nav>
    </div>
    </TooltipProvider>
  );
}

function MobileMoreMenu({
  items,
  onLogout,
}: {
  items: typeof navItems;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="flex w-full flex-col items-center justify-center text-[10px] font-medium text-slate-400"
        >
          <Menu className="mb-0.5 h-6 w-6" aria-hidden="true" />
          <span>Ещё</span>
        </button>
      </SheetTrigger>
      <SheetContent className="h-auto p-0">
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle>Меню</SheetTitle>
        </SheetHeader>
        <div className="grid gap-1 p-3">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-foreground hover:bg-muted"
            >
              <item.icon className="size-5 text-muted-foreground" aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="flex items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-semibold text-destructive hover:bg-destructive/10"
          >
            <LogOut className="size-5" aria-hidden="true" />
            Выйти
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
