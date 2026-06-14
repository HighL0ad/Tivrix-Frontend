import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router";

import { AppLayout } from "@/widgets/app-layout/AppLayout";
import { Toaster } from "@/shared/ui/sonner";
import { AccessGuard } from "@/app/AccessGuard";
import { AppShellLoading } from "@/shared/ui/page-state";

const DashboardPage = lazy(() =>
  import("@/pages/dashboard/DashboardPage").then((module) => ({
    default: module.DashboardPage,
  })),
);
const LoginPage = lazy(() =>
  import("@/pages/login/LoginPage").then((module) => ({
    default: module.LoginPage,
  })),
);
const SetPasswordPage = lazy(() =>
  import("@/pages/login/SetPasswordPage").then((module) => ({
    default: module.SetPasswordPage,
  })),
);
const ProductCreatePage = lazy(() =>
  import("@/pages/products/ProductCreatePage").then((module) => ({
    default: module.ProductCreatePage,
  })),
);
const ProductDetailPage = lazy(() =>
  import("@/pages/products/ProductDetailPage").then((module) => ({
    default: module.ProductDetailPage,
  })),
);
const ProductEditPage = lazy(() =>
  import("@/pages/products/ProductEditPage").then((module) => ({
    default: module.ProductEditPage,
  })),
);
const ProductsPage = lazy(() =>
  import("@/pages/products/ProductsPage").then((module) => ({
    default: module.ProductsPage,
  })),
);
const FinancePage = lazy(() =>
  import("@/pages/finance/FinancePage").then((module) => ({
    default: module.FinancePage,
  })),
);
const DebtsPage = lazy(() =>
  import("@/pages/debts/DebtsPage").then((module) => ({
    default: module.DebtsPage,
  })),
);
const ClientsPage = lazy(() =>
  import("@/pages/clients/ClientsPage").then((module) => ({
    default: module.ClientsPage,
  })),
);
const ClientDetailPage = lazy(() =>
  import("@/pages/clients/ClientDetailPage").then((module) => ({
    default: module.ClientDetailPage,
  })),
);
const CatalogsPage = lazy(() =>
  import("@/pages/catalogs/CatalogsPage").then((module) => ({
    default: module.CatalogsPage,
  })),
);
const UsersPage = lazy(() =>
  import("@/pages/users/UsersPage").then((module) => ({
    default: module.UsersPage,
  })),
);
const SettingsPage = lazy(() =>
  import("@/pages/settings/SettingsPage").then((module) => ({
    default: module.SettingsPage,
  })),
);

export function App() {
  return (
    <>
      <Suspense fallback={<AppShellLoading />}>
        <Routes>
          <Route path="login" element={<LoginPage />} />
          <Route path="set-password" element={<SetPasswordPage />} />
          <Route element={<AppLayout />}>
            <Route index element={<AccessGuard resource="dashboard"><DashboardPage /></AccessGuard>} />
            <Route path="products" element={<AccessGuard resource="products"><ProductsPage /></AccessGuard>} />
            <Route path="products/new" element={<AccessGuard resource="products"><ProductCreatePage /></AccessGuard>} />
            <Route path="products/:productId" element={<AccessGuard resource="products"><ProductDetailPage /></AccessGuard>} />
            <Route path="products/:productId/edit" element={<AccessGuard resource="products"><ProductEditPage /></AccessGuard>} />
            <Route path="finance" element={<AccessGuard resource="finance"><FinancePage /></AccessGuard>} />
            <Route path="debts" element={<AccessGuard resource="debts"><DebtsPage /></AccessGuard>} />
            <Route path="clients" element={<AccessGuard resource="clients"><ClientsPage /></AccessGuard>} />
            <Route path="clients/:clientId" element={<AccessGuard resource="clients"><ClientDetailPage /></AccessGuard>} />
            <Route path="catalogs" element={<AccessGuard resource="catalogs"><CatalogsPage /></AccessGuard>} />
            <Route path="users" element={<AccessGuard adminOnly><UsersPage /></AccessGuard>} />
            <Route path="settings" element={<AccessGuard superAdminOnly><SettingsPage /></AccessGuard>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
      <Toaster />
    </>
  );
}

