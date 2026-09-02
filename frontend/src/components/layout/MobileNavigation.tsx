import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, Receipt, Users } from 'lucide-react';
import { useAuth } from '../../features/auth/hooks/useAuth';

export const MobileNavigation: React.FC = () => {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-white border-t border-[#E4E4E7] flex items-center justify-around z-40 px-2">
      <NavLink
        to="/"
        className={({ isActive }) =>
          `flex flex-col items-center gap-0.5 text-[10px] font-medium ${isActive ? 'text-black font-bold' : 'text-[#71717A]'}`
        }
      >
        <LayoutDashboard className="w-5 h-5" />
        <span>Home</span>
      </NavLink>

      <NavLink
        to="/pos"
        className={({ isActive }) =>
          `flex flex-col items-center gap-0.5 text-[10px] font-medium ${isActive ? 'text-black font-bold' : 'text-[#71717A]'}`
        }
      >
        <ShoppingCart className="w-5 h-5" />
        <span>POS</span>
      </NavLink>

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
        <span>Ledger</span>
      </NavLink>
    </nav>
  );
};
