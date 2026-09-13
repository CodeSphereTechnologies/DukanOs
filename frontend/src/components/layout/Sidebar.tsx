import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  CreditCard,
  TrendingUp,
  Shield,
  History,
  Coins,
  ChevronLeft,
  ChevronRight,
  Sliders,
  Building2,
  Receipt,
  UserCheck,
  X,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import type { User, RoleSlug } from '../../types/auth.types';

export interface NavItemConfig {
  label: string;
  path: string;
  icon: React.ReactNode;
  allowedRoles: RoleSlug[];
}

const NAV_ITEMS: NavItemConfig[] = [
  // Super Admin Navigation
  { label: 'Platform Hub', path: '/super-admin/dashboard', icon: <Shield className="w-4 h-4" />, allowedRoles: ['super_admin'] },
  { label: 'Tenants', path: '/super-admin/tenants', icon: <Building2 className="w-4 h-4" />, allowedRoles: ['super_admin'] },
  { label: 'Specifications', path: '/super-admin/specifications', icon: <Sliders className="w-4 h-4" />, allowedRoles: ['super_admin'] },

  // Role Dashboards
  { label: 'Owner Dashboard', path: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" />, allowedRoles: ['owner'] },
  { label: 'Operations Hub', path: '/manager/dashboard', icon: <LayoutDashboard className="w-4 h-4" />, allowedRoles: ['manager'] },
  { label: 'Cashier Hub', path: '/cashier/dashboard', icon: <LayoutDashboard className="w-4 h-4" />, allowedRoles: ['cashier'] },
  { label: 'Accounting Hub', path: '/accountant/dashboard', icon: <Coins className="w-4 h-4" />, allowedRoles: ['accountant'] },

  // Store Operational Modules
  { label: 'POS Terminal', path: '/pos', icon: <ShoppingCart className="w-4 h-4" />, allowedRoles: ['cashier', 'owner', 'manager'] },
  { label: 'Products & Stock', path: '/products', icon: <Package className="w-4 h-4" />, allowedRoles: ['owner', 'manager', 'cashier'] },
  { label: 'Invoices', path: '/invoices', icon: <Receipt className="w-4 h-4" />, allowedRoles: ['owner', 'manager', 'cashier', 'accountant'] },
  { label: 'Quotations', path: '/quotations', icon: <Receipt className="w-4 h-4" />, allowedRoles: ['owner', 'manager'] },
  { label: 'Customers & Ledger', path: '/customers', icon: <Users className="w-4 h-4" />, allowedRoles: ['owner', 'manager', 'cashier', 'accountant'] },
  { label: 'Daily Cashflow', path: '/finance', icon: <CreditCard className="w-4 h-4" />, allowedRoles: ['owner', 'accountant'] },
  { label: 'Payroll & Salaries', path: '/payroll', icon: <UserCheck className="w-4 h-4" />, allowedRoles: ['owner', 'accountant'] },
  { label: 'Reports & Analytics', path: '/reports', icon: <TrendingUp className="w-4 h-4" />, allowedRoles: ['owner', 'manager', 'accountant'] },
  { label: 'Store Users', path: '/users', icon: <Users className="w-4 h-4" />, allowedRoles: ['owner'] },
  { label: 'Audit Trail', path: '/audit', icon: <History className="w-4 h-4" />, allowedRoles: ['owner', 'super_admin'] },
];

export interface SidebarProps {
  user: User;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onNavigate?: () => void;
  isMobile?: boolean;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  collapsed,
  onToggleCollapse,
  onNavigate,
  isMobile = false,
  className,
}) => {
  const isSuperAdmin = user.role.slug === 'super_admin';

  const visibleNavItems = NAV_ITEMS.filter((item) => {
    if (isSuperAdmin) return true;
    return item.allowedRoles.includes(user.role.slug);
  });

  return (
    <aside
      className={cn(
        'h-screen bg-[#FFFFFF] border-r border-[#E4E4E7] flex flex-col justify-between transition-all duration-200 ease-in-out select-none',
        collapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      <div className="flex flex-col flex-1 min-h-0">
        {/* Brand Header */}
        <div className="h-14 shrink-0 border-b border-[#E4E4E7] px-4 flex items-center justify-between">
          {!collapsed ? (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-black rounded-lg flex items-center justify-center text-white font-bold text-sm tracking-tighter shadow-sm">
                D
              </div>
              <span className="font-bold text-base tracking-tight font-display text-[#18181B]">
                Dukan<span className="text-[#065F46]">OS</span>
              </span>
            </div>
          ) : (
            <div className="flex items-center">
              <div className="w-7 h-7 bg-black rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm">
                D
              </div>
              <button
                type="button"
                onClick={onToggleCollapse}
                className="p-1 rounded-full text-[#71717A] hover:text-black hover:bg-[#F4F4F5] transition-colors flex-shrink-0"
                title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            </div>
          )}

          {isMobile ? (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-1.5 rounded-full text-[#71717A] hover:text-black hover:bg-[#F4F4F5] transition-colors"
              title="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-1 rounded-full text-[#71717A] hover:text-black hover:bg-[#F4F4F5] transition-colors"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Navigation List */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto overflow-x-hidden scrollbar-width-none">
          <style>{`
            *::-webkit-scrollbar { display: none; }
            * { scrollbar-width: none; }
          `}</style>
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => {
                if (onNavigate) onNavigate();
              }}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-full py-1.5 px-2 text-xs font-medium transition-colors',
                  isActive
                    ? 'bg-black text-white shadow-sm'
                    : 'text-[#52525B] hover:text-black hover:bg-[#F4F4F5]',
                  collapsed && 'justify-center'
                )
              }
              title={collapsed ? item.label : undefined}
            >
              <span className="flex w-4 items-center justify-center">{item.icon}</span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Tenant Indicator at Footer */}
      {!collapsed && user.tenant && (
        <div className="shrink-0 p-3 m-3 border border-[#E4E4E7] rounded-xl bg-[#FAFAF8] text-xs">
          <div className="font-semibold text-[#18181B] truncate">{user.tenant.name}</div>
          <div className="text-[11px] text-[#71717A] capitalize">{user.role.name}</div>
        </div>
      )}
    </aside>
  );
};

