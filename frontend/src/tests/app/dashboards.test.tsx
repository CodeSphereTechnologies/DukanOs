import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { SuperAdminDashboard } from '../../features/dashboard/pages/SuperAdminDashboard';
import { OwnerDashboard } from '../../features/dashboard/pages/OwnerDashboard';
import { ManagerDashboard } from '../../features/dashboard/pages/ManagerDashboard';
import { AccountantDashboard } from '../../features/dashboard/pages/AccountantDashboard';
import { CashierDashboard } from '../../features/dashboard/pages/CashierDashboard';

describe('Role Dashboards Rendering', () => {
  it('renders SuperAdminDashboard with metrics and tenant management', () => {
    render(
      <MemoryRouter>
        <SuperAdminDashboard />
      </MemoryRouter>
    );
    expect(screen.getByText('Platform Super Admin')).toBeInTheDocument();
    expect(screen.getByText('Total Tenants')).toBeInTheDocument();
    expect(screen.getByText('Provision Tenant')).toBeInTheDocument();
  });

  it('renders OwnerDashboard with sales overview and quick action cards', () => {
    render(
      <MemoryRouter>
        <OwnerDashboard />
      </MemoryRouter>
    );
    expect(screen.getByText('Store Owner Dashboard')).toBeInTheDocument();
    expect(screen.getByText("Today's Sales")).toBeInTheDocument();
    expect(screen.getByText('Launch POS')).toBeInTheDocument();
  });

  it('renders ManagerDashboard with operations and inventory alerts', () => {
    render(
      <MemoryRouter>
        <ManagerDashboard />
      </MemoryRouter>
    );
    expect(screen.getByText('Operations Management')).toBeInTheDocument();
    expect(screen.getByText('Inventory Alerts')).toBeInTheDocument();
  });

  it('renders AccountantDashboard with financial metrics and daily ledger', () => {
    render(
      <MemoryRouter>
        <AccountantDashboard />
      </MemoryRouter>
    );
    expect(screen.getByText('Financial Accounting & Ledger')).toBeInTheDocument();
    expect(screen.getByText('Net Cashflow')).toBeInTheDocument();
    expect(screen.getByText('Record Transaction')).toBeInTheDocument();
  });

  it('renders CashierDashboard with fast POS action and today sales', () => {
    render(
      <MemoryRouter>
        <CashierDashboard />
      </MemoryRouter>
    );
    expect(screen.getByText('Cashier POS Hub')).toBeInTheDocument();
    expect(screen.getByText('New Sale / POS Counter')).toBeInTheDocument();
    expect(screen.getByText("Today's Register Total")).toBeInTheDocument();
  });
});
