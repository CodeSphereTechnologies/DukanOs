import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthLayout } from '../layouts/AuthLayout';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { POSLayout } from '../layouts/POSLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleRoute } from './RoleRoute';
import { useAuth } from '../features/auth/hooks/useAuth';
import { ROLE_DASHBOARDS } from '../lib/constants';

import { LoginPage } from '../features/auth/pages/LoginPage';
import { LandingPage } from '../features/landing/pages/LandingPage';
import { SuperAdminDashboard } from '../features/dashboard/pages/SuperAdminDashboard';
import { OwnerDashboard } from '../features/dashboard/pages/OwnerDashboard';
import { ManagerDashboard } from '../features/dashboard/pages/ManagerDashboard';
import { AccountantDashboard } from '../features/dashboard/pages/AccountantDashboard';
import { CashierDashboard } from '../features/dashboard/pages/CashierDashboard';
import { ForbiddenPage } from '../features/dashboard/pages/ForbiddenPage';
import { POSPage } from '../features/pos/pages/POSPage';
import { ProductsPage } from '../features/products/pages/ProductsPage';
import { CreateProductPage } from '../features/products/pages/CreateProductPage';
import { EditProductPage } from '../features/products/pages/EditProductPage';
import { ProductDetailPage } from '../features/products/pages/ProductDetailPage';
import { CatalogPage } from '../features/products/pages/CatalogPage';
import { InvoicesPage } from '../features/invoices/pages/InvoicesPage';
import { QuotationsPage } from '../features/quotations/pages/QuotationsPage';
import { CustomersPage } from '../features/customers/pages/CustomersPage';
import { FinancePage } from '../features/finance/pages/FinancePage';
import { PayrollPage } from '../features/payroll/pages/PayrollPage';
import { ReportsPage } from '../features/reports/pages/ReportsPage';
import { UsersPage } from '../features/users/pages/UsersPage';
import { AuditPage } from '../features/audit/pages/AuditPage';
import { TenantsPage } from '../features/tenants/pages/TenantsPage';
import { CreateTenantPage } from '../features/tenants/pages/CreateTenantPage';
import { SpecificationsPage } from '../features/specifications/pages/SpecificationsPage';

// If authenticated → redirect to role dashboard; otherwise show landing page
// If authenticated → redirect to role dashboard; otherwise show the landing page
const RootRedirect: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
    return <LandingPage />;
  }
  const target = ROLE_DASHBOARDS[user.role.slug] || '/dashboard';
  return <Navigate to={target} replace />;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public landing page & auth */}
      <Route path="/" element={<RootRedirect />} />
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['cashier', 'owner', 'manager']}>
              <POSLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route path="/pos" element={<POSPage />} />
      </Route>

      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<RootRedirect />} />
        <Route path="/403" element={<ForbiddenPage />} />

        <Route
          path="/super-admin/dashboard"
          element={
            <RoleRoute allowedRoles={['super_admin']}>
              <SuperAdminDashboard />
            </RoleRoute>
          }
        />
        <Route
          path="/super-admin/tenants"
          element={
            <RoleRoute allowedRoles={['super_admin']}>
              <TenantsPage />
            </RoleRoute>
          }
        />
        <Route
          path="/super-admin/tenants/create"
          element={
            <RoleRoute allowedRoles={['super_admin']}>
              <CreateTenantPage />
            </RoleRoute>
          }
        />
        <Route
          path="/super-admin/specifications"
          element={
            <RoleRoute allowedRoles={['super_admin']}>
              <SpecificationsPage />
            </RoleRoute>
          }
        />
        <Route
          path="/super-admin/specifications/create"
          element={
            <RoleRoute allowedRoles={['super_admin']}>
              <SpecificationsPage />
            </RoleRoute>
          }
        />
        <Route
          path="/super-admin/audit"
          element={
            <RoleRoute allowedRoles={['super_admin']}>
              <AuditPage />
            </RoleRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <RoleRoute allowedRoles={['owner']}>
              <OwnerDashboard />
            </RoleRoute>
          }
        />
        <Route
          path="/manager/dashboard"
          element={
            <RoleRoute allowedRoles={['manager', 'owner']}>
              <ManagerDashboard />
            </RoleRoute>
          }
        />
        <Route
          path="/cashier/dashboard"
          element={
            <RoleRoute allowedRoles={['cashier', 'owner']}>
              <CashierDashboard />
            </RoleRoute>
          }
        />
        <Route
          path="/accountant/dashboard"
          element={
            <RoleRoute allowedRoles={['accountant', 'owner']}>
              <AccountantDashboard />
            </RoleRoute>
          }
        />

        <Route
          path="/products"
          element={
            <RoleRoute allowedRoles={['owner', 'manager', 'cashier']}>
              <ProductsPage />
            </RoleRoute>
          }
        />
        <Route
          path="/catalog"
          element={
            <RoleRoute allowedRoles={['owner', 'manager']}>
              <CatalogPage />
            </RoleRoute>
          }
        />
        <Route
          path="/products/create"
          element={
            <RoleRoute allowedRoles={['owner', 'manager', 'cashier']}>
              <CreateProductPage />
            </RoleRoute>
          }
        />
        <Route
          path="/products/:id/edit"
          element={
            <RoleRoute allowedRoles={['owner', 'manager', 'cashier']}>
              <EditProductPage />
            </RoleRoute>
          }
        />
        <Route
          path="/products/:id"
          element={
            <RoleRoute allowedRoles={['owner', 'manager', 'cashier']}>
              <ProductDetailPage />
            </RoleRoute>
          }
        />
        <Route
          path="/invoices"
          element={
            <RoleRoute allowedRoles={['owner', 'manager', 'cashier', 'accountant']}>
              <InvoicesPage />
            </RoleRoute>
          }
        />
        <Route
          path="/quotations"
          element={
            <RoleRoute allowedRoles={['owner', 'manager']}>
              <QuotationsPage />
            </RoleRoute>
          }
        />
        <Route
          path="/customers"
          element={
            <RoleRoute allowedRoles={['owner', 'manager', 'cashier', 'accountant']}>
              <CustomersPage />
            </RoleRoute>
          }
        />
        <Route
          path="/finance"
          element={
            <RoleRoute allowedRoles={['owner', 'accountant']}>
              <FinancePage />
            </RoleRoute>
          }
        />
        <Route
          path="/payroll"
          element={
            <RoleRoute allowedRoles={['owner', 'accountant']}>
              <PayrollPage />
            </RoleRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <RoleRoute allowedRoles={['owner', 'manager', 'accountant']}>
              <ReportsPage />
            </RoleRoute>
          }
        />
        <Route
          path="/users"
          element={
            <RoleRoute allowedRoles={['owner']}>
              <UsersPage />
            </RoleRoute>
          }
        />
        <Route
          path="/audit"
          element={
            <RoleRoute allowedRoles={['owner']}>
              <AuditPage />
            </RoleRoute>
          }
        />
      </Route>

      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
};
