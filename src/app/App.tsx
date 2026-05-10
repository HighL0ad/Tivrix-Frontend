import { Navigate, Route, Routes } from "react-router";

import { AppLayout } from "@/widgets/app-layout/AppLayout";
import { DashboardPage } from "@/pages/dashboard/DashboardPage";
import { LoginPage } from "@/pages/login/LoginPage";
import { ProductCreatePage } from "@/pages/products/ProductCreatePage";
import { ProductDetailPage } from "@/pages/products/ProductDetailPage";
import { ProductEditPage } from "@/pages/products/ProductEditPage";
import { ProductsPage } from "@/pages/products/ProductsPage";
import { FinancePage } from "@/pages/finance/FinancePage";
import { DebtsPage } from "@/pages/debts/DebtsPage";
import { CatalogsPage } from "@/pages/catalogs/CatalogsPage";
import { UsersPage } from "@/pages/users/UsersPage";
import { Toaster } from "@/shared/ui/sonner";
import { AccessGuard } from "@/app/AccessGuard";

export function App() {
  return (
    <>
      <Routes>
        <Route path="login" element={<LoginPage />} />
        <Route element={<AppLayout />}>
          <Route index element={<AccessGuard resource="dashboard"><DashboardPage /></AccessGuard>} />
          <Route path="products" element={<AccessGuard resource="products"><ProductsPage /></AccessGuard>} />
          <Route path="products/new" element={<AccessGuard resource="products"><ProductCreatePage /></AccessGuard>} />
          <Route path="products/:productId" element={<AccessGuard resource="products"><ProductDetailPage /></AccessGuard>} />
          <Route path="products/:productId/edit" element={<AccessGuard resource="products"><ProductEditPage /></AccessGuard>} />
          <Route path="finance" element={<AccessGuard resource="finance"><FinancePage /></AccessGuard>} />
          <Route path="debts" element={<AccessGuard resource="debts"><DebtsPage /></AccessGuard>} />
          <Route path="catalogs" element={<AccessGuard resource="catalogs"><CatalogsPage /></AccessGuard>} />
          <Route path="users" element={<AccessGuard adminOnly><UsersPage /></AccessGuard>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      <Toaster />
    </>
  );
}
