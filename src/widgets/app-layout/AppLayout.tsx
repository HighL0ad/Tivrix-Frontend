import { useRef, useState } from "react";
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
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import {
  useCurrentUser,
  useUploadAvatar,
} from "@/entities/auth/api/use-current-user";
import type { CurrentUser } from "@/entities/auth/model/types";
import { logout } from "@/entities/auth/api/logout";
import { getApiErrorMessage } from "@/shared/api/error";
import { LanguageRow } from "@/shared/i18n/LanguageSwitcher";
import { queryClient } from "@/shared/api/query-client";
import { Button } from "@/shared/ui/button";
import { buttonVariants } from "@/shared/ui/button-variants";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/ui/sheet";
import { CommandMenuTrigger, CommandMenuDialog } from "@/widgets/command-menu/CommandMenu";
import { cn } from "@/shared/lib/utils";

const navItems = [
  { to: "/", labelKey: "app.nav.dashboard", icon: Gauge, resource: "dashboard" },
  { to: "/products", labelKey: "app.nav.products", icon: Boxes, resource: "products" },
  { to: "/finance", labelKey: "app.nav.finance", icon: Banknote, resource: "finance" },
  { to: "/debts", labelKey: "app.nav.debts", icon: HandCoins, resource: "debts" },
  { to: "/catalogs", labelKey: "app.nav.catalogs", icon: Database, resource: "catalogs" },
  { to: "/users", labelKey: "app.nav.users", icon: Users, adminOnly: true },
];

const mobileNavLabelClass = "text-[10px] font-medium leading-none";

export function AppLayout() {
  const { t } = useTranslation();
  const currentUserQuery = useCurrentUser();
  const currentUser = currentUserQuery.data;
  const uploadAvatar = useUploadAvatar();
  const [commandOpen, setCommandOpen] = useState(false);
  const visibleNavItems = navItems.filter((item) => {
    return item.adminOnly ? currentUser?.is_admin : true;
  });

  async function handleLogout() {
    await logout();
    queryClient.removeQueries({ queryKey: ["auth"] });
    window.location.assign("/login");
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed z-40 hidden h-full w-64 flex-col border-r border-white/10 bg-[#0f172a] text-white md:flex">
        <NavLink to="/" className="block border-b border-white/10 px-5 py-5">
          <h1 className="text-xl font-black tracking-tight text-white">
            Ferdi <span className="text-xs font-bold text-slate-300">Telefon</span>
          </h1>
        </NavLink>

        <nav className="flex flex-1 flex-col gap-1.5 p-3">
          <div className="mb-2">
            <CommandMenuTrigger 
              onClick={() => setCommandOpen(true)} 
              className="flex h-10 w-full items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-slate-400 hover:bg-white/10 hover:text-white" 
              kbdClassName="border border-white/20 bg-white/10" 
            />
          </div>
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
              <span>{t(item.labelKey)}</span>
            </NavLink>
          ))}

          <div className="mt-3 border-t border-white/10 pt-3">
            <Button asChild className="w-full bg-[#4f46e5] hover:bg-indigo-500">
              <NavLink to="/products/new">
                <Plus aria-hidden="true" />
                {t("app.addProduct")}
              </NavLink>
            </Button>
          </div>

          <div className="mt-auto space-y-2 pt-4">
            {currentUser ? (
              <div className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] text-xs text-slate-300">
                <div className="flex min-w-0 items-center gap-2 px-3 py-2.5">
                  <UserAvatar
                    user={currentUser}
                    onUpload={(file) =>
                      uploadAvatar.mutate(file, {
                        onSuccess: () => toast.success(t("app.profilePhotoUpdated")),
                        onError: (error) => toast.error(getApiErrorMessage(error)),
                      })
                    }
                    pending={uploadAvatar.isPending}
                  />
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-white">
                      {currentUser.username}
                    </div>
                    <div className="mt-0.5 text-xs uppercase text-slate-500">
                      {currentUser.role}
                    </div>
                  </div>
                </div>
                <div className="border-t border-white/10" />
                <LanguageRow />
                <div className="border-t border-white/10" />
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-semibold text-slate-300 transition-colors hover:bg-rose-500/10 hover:text-rose-200"
                >
                  <LogOut className="size-4" aria-hidden="true" />
                  {t("auth.logout")}
                </button>
              </div>
            ) : (
              <div className="h-10 animate-pulse rounded-lg bg-white/10" />
            )}
          </div>
        </nav>
      </aside>

      <main className="w-full transition-all duration-300 md:pl-64">
        <div className="mx-auto max-w-md p-4 pb-24 md:max-w-7xl md:p-6 lg:p-8 md:pb-8">
          <header className="sticky top-2 z-30 mb-4 flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white px-4 py-2.5 shadow-sm md:hidden">
            <NavLink to="/" className="shrink-0 text-lg font-bold text-indigo-700">
              {t("app.brand")}
            </NavLink>
            <div className="flex items-center gap-2">
              <CommandMenuTrigger 
                onClick={() => setCommandOpen(true)} 
                className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200" 
                kbdClassName="hidden" 
                showLabel={false}
              />
              {currentUser ? (
                <UserAvatar
                  user={currentUser}
                  onUpload={(file) =>
                    uploadAvatar.mutate(file, {
                      onSuccess: () => toast.success(t("app.profilePhotoUpdated")),
                      onError: (error) => toast.error(getApiErrorMessage(error)),
                    })
                  }
                  pending={uploadAvatar.isPending}
                  className="border-indigo-100 bg-indigo-50 text-indigo-700"
                />
              ) : null}
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
              <span className={mobileNavLabelClass}>{t(item.labelKey)}</span>
            </NavLink>
          ))}
          <div className="relative -top-5 flex justify-center">
            <NavLink
              to="/products/new"
              className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#4f46e5] text-white shadow-lg shadow-indigo-950/40 transition-transform hover:scale-105 hover:bg-indigo-500"
              aria-label={t("app.addProduct")}
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
              <span className={mobileNavLabelClass}>{t(item.labelKey)}</span>
            </NavLink>
          ))}
          <MobileMoreMenu
            items={visibleNavItems.slice(3)}
            onLogout={handleLogout}
          />
        </div>
      </nav>
      <CommandMenuDialog open={commandOpen} setOpen={setCommandOpen} />
    </div>
  );
}

function UserAvatar({
  user,
  onUpload,
  pending,
  className,
}: {
  user: CurrentUser;
  onUpload: (file: File) => void;
  pending: boolean;
  className?: string;
}) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const initials = getInitials(user.username);

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={pending}
        className={cn(
          "relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white/10 text-sm font-black uppercase text-white transition-opacity hover:opacity-85 disabled:cursor-wait disabled:opacity-60",
          className,
        )}
        aria-label={t("app.uploadProfilePhoto")}
        title={t("app.uploadProfilePhoto")}
      >
        {user.avatar_url ? (
          <img
            src={user.avatar_url}
            alt=""
            className="size-full object-cover"
          />
        ) : (
          initials
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) {
            onUpload(file);
          }
        }}
      />
    </>
  );
}

function getInitials(value: string) {
  return value
    .trim()
    .slice(0, 2)
    .toUpperCase() || "U";
}

function MobileMoreMenu({
  items,
  onLogout,
}: {
  items: typeof navItems;
  onLogout: () => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="flex h-full w-full appearance-none flex-col items-center justify-center bg-transparent p-0 text-[10px] font-medium leading-none text-slate-400"
        >
          <Menu className="mb-1 h-5 w-5" aria-hidden="true" />
          <span className={mobileNavLabelClass}>{t("app.more")}</span>
        </button>
      </SheetTrigger>
      <SheetContent className="h-auto border-white/10 bg-[#0f172a] p-0 text-white">
        <SheetHeader className="border-b border-white/10 px-5 py-4">
          <SheetTitle className="text-white">{t("app.menu")}</SheetTitle>
        </SheetHeader>
        <div className="grid gap-1 p-3">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-slate-300 hover:bg-white/10 hover:text-white"
            >
              <item.icon className="size-5 text-slate-500" aria-hidden="true" />
              {t(item.labelKey)}
            </NavLink>
          ))}
          <div className="mt-2 overflow-hidden rounded-lg border border-white/10 bg-white/[0.04]">
            <LanguageRow />
            <div className="border-t border-white/10" />
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-semibold text-slate-300 transition-colors hover:bg-rose-500/10 hover:text-rose-200"
            >
              <LogOut className="size-4" aria-hidden="true" />
              {t("auth.logout")}
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
