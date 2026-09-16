import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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
  Sliders,
  Building2,
  Receipt,
  UserCheck,
  Tags,
  X,
  PanelLeftClose,
  PanelLeftOpen,
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
  { label: 'Categories, Brands & Units', path: '/catalog', icon: <Tags className="w-4 h-4" />, allowedRoles: ['owner', 'manager'] },
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
  const location = useLocation();

  const visibleNavItems = NAV_ITEMS.filter((item) => {
    if (isSuperAdmin) return true;
    return item.allowedRoles.includes(user.role.slug);
  });

  return (
    <aside
      className={cn(
        'relative h-screen bg-[#FFFFFF] border-r border-[#E4E4E7] flex flex-col justify-between transition-all duration-300 ease-in-out select-none',
        collapsed ? 'w-[68px]' : 'w-64',
        className
      )}
    >
      <div className="flex flex-col flex-1 min-h-0">
        {/* Brand Header */}
        <div
          className={cn(
            'h-14 shrink-0 border-b border-[#E4E4E7] flex items-center transition-all duration-300',
            collapsed ? 'justify-center px-2' : 'justify-between px-4'
          )}
        >
          {isMobile ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 bg-[#18181B] rounded-lg flex items-center justify-center text-white font-bold text-sm tracking-tight shadow-xs shrink-0">
                  D
                </div>
                <span className="font-bold text-base tracking-tight font-display text-[#18181B]">
                  Dukan<span className="text-[#059669]">OS</span>
                </span>
              </div>
              <button
                type="button"
                onClick={onToggleCollapse}
                className="p-1.5 rounded-lg text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5] transition-colors"
                title="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : !collapsed ? (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 bg-[#18181B] rounded-lg flex items-center justify-center text-white font-bold text-sm tracking-tight shadow-xs shrink-0">
                D
              </div>
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-bold text-sm tracking-tight font-display text-[#18181B] truncate">
                  Dukan<span className="text-[#059669]">OS</span>
                </span>
                <span className="text-[9px] font-semibold uppercase tracking-wider bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] px-1.5 py-0.5 rounded-full leading-none">
                  Pro
                </span>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 bg-[#18181B] rounded-lg flex items-center justify-center text-white font-bold text-sm tracking-tight shadow-xs shrink-0">
              D
            </div>
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
              className={({ isActive }) => {
                const active = item.path === '/catalog'
                  ? location.pathname === '/catalog'
                  : isActive;
                return cn(
                  'group relative flex items-center gap-2.5 rounded-lg py-2 px-2.5 text-xs font-medium transition-all duration-150',
                  active
                    ? 'bg-[#18181B] text-white shadow-xs'
                    : 'text-[#52525B] hover:text-[#18181B] hover:bg-[#F4F4F5]',
                  collapsed && 'justify-center px-0 w-10 h-10 mx-auto'
                );
              }}
            >
              <span className="flex w-4 h-4 items-center justify-center shrink-0">
                {item.icon}
              </span>
              {!collapsed ? (
                <span className="truncate">{item.label}</span>
              ) : (
                <span
                  className={cn(
                    'absolute left-[calc(100%+12px)] px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap',
                    'bg-[#18181B] text-white shadow-xl pointer-events-none opacity-0 translate-x-1',
                    'group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 z-50',
                    'flex items-center gap-1.5 border border-[#27272A]'
                  )}
                >
                  {item.label}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Footer Area: Tenant Info & Collapse Toggle */}
      <div className="shrink-0 p-2 border-t border-[#E4E4E7] space-y-1.5 bg-[#FFFFFF]">
        {/* Tenant Indicator */}
        {user.tenant && (
          !collapsed ? (
            <div className="p-2.5 border border-[#E4E4E7] rounded-xl bg-[#FAFAF8] text-xs">
              <div className="font-semibold text-[#18181B] truncate">{user.tenant.name}</div>
              <div className="text-[11px] text-[#71717A] capitalize">{user.role.name}</div>
            </div>
          ) : (
            <div
              className="group relative flex justify-center py-1 cursor-default"
              title={`${user.tenant.name} (${user.role.name})`}
            >
              <div className="w-8 h-8 rounded-lg bg-[#FAFAF8] border border-[#E4E4E7] flex items-center justify-center text-xs font-bold text-[#18181B] hover:border-[#18181B] transition-colors">
                {user.tenant.name.slice(0, 1).toUpperCase()}
              </div>
              <span className="absolute left-[calc(100%+12px)] px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap bg-[#18181B] text-white shadow-xl pointer-events-none opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 z-50 border border-[#27272A]">
                <span className="font-semibold">{user.tenant.name}</span>
                <span className="text-[#A1A1AA] ml-1.5 capitalize">({user.role.name})</span>
              </span>
            </div>
          )
        )}

        {/* Footer Toggle Bar (Desktop only) */}
        {!isMobile && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className={cn(
              'w-full flex items-center rounded-lg text-xs font-medium text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5] transition-colors group relative cursor-pointer',
              collapsed ? 'justify-center w-10 h-10 mx-auto p-0' : 'justify-between px-2.5 py-2'
            )}
            title={collapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
          >
            {collapsed ? (
              <>
                <PanelLeftOpen className="w-4 h-4 text-[#71717A] group-hover:text-[#18181B] transition-colors" />
                <span className="absolute left-[calc(100%+12px)] px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap bg-[#18181B] text-white shadow-xl pointer-events-none opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 z-50 border border-[#27272A]">
                  Expand sidebar (Ctrl+B)
                </span>
              </>
            ) : (
              <>
                <span className="flex items-center gap-2">
                  <PanelLeftClose className="w-4 h-4 text-[#71717A] group-hover:text-[#18181B] transition-colors" />
                  <span>Collapse</span>
                </span>
                <kbd className="text-[10px] font-mono px-1.5 py-0.5 bg-[#F4F4F5] text-[#71717A] rounded border border-[#E4E4E7]">
                  Ctrl+B
                </kbd>
              </>
            )}
          </button>
        )}
      </div>
    </aside>
  );
};

