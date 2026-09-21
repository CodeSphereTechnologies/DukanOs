import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Receipt, Users, Package } from 'lucide-react';
import { useAuth } from '../../features/auth/hooks/useAuth';

export const MobileNavigation: React.FC = () => {
  const { user } = useAuth();
  if (!user) return null;

  const isSuperAdmin = user.role.slug === 'super_admin';
  const showPos = !isSuperAdmin && user.role.slug !== 'accountant';

  if (isSuperAdmin) {
    return (
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-white border-t border-[#E4E4E7] flex items-center justify-around z-40 px-2 shadow-lg print:hidden">
        <NavLink
          to="/super-admin/dashboard"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 text-[10px] font-medium ${isActive ? 'text-black font-bold' : 'text-[#71717A]'}`
          }
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Overview</span>
        </NavLink>

        <NavLink
          to="/super-admin/tenants"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 text-[10px] font-medium ${isActive ? 'text-black font-bold' : 'text-[#71717A]'}`
          }
        >
          <Users className="w-5 h-5" />
          <span>Tenants</span>
        </NavLink>

        <NavLink
          to="/users"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 text-[10px] font-medium ${isActive ? 'text-black font-bold' : 'text-[#71717A]'}`
          }
        >
          <Users className="w-5 h-5" />
          <span>Users</span>
        </NavLink>

        <NavLink
          to="/audit"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 text-[10px] font-medium ${isActive ? 'text-black font-bold' : 'text-[#71717A]'}`
          }
        >
          <Receipt className="w-5 h-5" />
          <span>Audit</span>
        </NavLink>
      </nav>
    );
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-white border-t border-[#E4E4E7] flex items-center justify-around z-40 px-2 shadow-lg print:hidden">
      <NavLink
        to="/"
        className={({ isActive }) =>
          `flex flex-col items-center gap-0.5 text-[10px] font-medium ${isActive ? 'text-black font-bold' : 'text-[#71717A]'}`
        }
      >
        <LayoutDashboard className="w-5 h-5" />
        <span>Home</span>
      </NavLink>

      {showPos && (
        <NavLink
          to="/pos"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 text-[10px] font-medium ${isActive ? 'text-black font-bold' : 'text-[#71717A]'}`
          }
        >
          <ShoppingCart className="w-5 h-5" />
          <span>POS</span>
        </NavLink>
      )}

      <NavLink
        to="/products"
        className={({ isActive }) =>
          `flex flex-col items-center gap-0.5 text-[10px] font-medium ${isActive ? 'text-black font-bold' : 'text-[#71717A]'}`
        }
      >
        <Package className="w-5 h-5" />
        <span>Stock</span>
      </NavLink>

      <NavLink
        to="/invoices"
        className={({ isActive }) =>
          `flex flex-col items-center gap-0.5 text-[10px] font-medium ${isActive ? 'text-black font-bold' : 'text-[#71717A]'}`
        }
      >
        <Receipt className="w-5 h-5" />
        <span>Invoices</span>
      </NavLink>

      <NavLink
        to="/customers"
        className={({ isActive }) =>
          `flex flex-col items-center gap-0.5 text-[10px] font-medium ${isActive ? 'text-black font-bold' : 'text-[#71717A]'}`
        }
      >
        <Users className="w-5 h-5" />
        <span>Khata</span>
      </NavLink>
    </nav>
  );
};
