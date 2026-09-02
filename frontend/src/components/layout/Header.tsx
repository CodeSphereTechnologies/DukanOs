import React from 'react';
import { Breadcrumb } from './Breadcrumb';
import { UserMenu } from './UserMenu';
import { Menu, Zap } from 'lucide-react';
import { useTenant } from '../../hooks/useTenant';

export interface HeaderProps {
  onMenuToggle?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const { tenant } = useTenant();

  return (
    <header className="h-14 bg-white border-b border-[#E4E4E7] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <button
            type="button"
            onClick={onMenuToggle}
            className="md:hidden p-2 rounded-lg text-[#71717A] hover:text-black hover:bg-[#F4F4F5]"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <Breadcrumb />
      </div>

      <div className="flex items-center gap-3">
        {tenant && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-[#FAFAF8] border border-[#E4E4E7] rounded-full text-xs font-semibold text-[#18181B]">
            <Zap className="w-3.5 h-3.5 text-[#065F46]" />
            <span>{tenant.name}</span>
          </div>
        )}
        <UserMenu />
      </div>
    </header>
  );
};
