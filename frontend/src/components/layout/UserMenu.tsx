import { Avatar } from "../ui/Avatar";
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { LogOut, ChevronDown } from 'lucide-react';
import { Badge } from '../ui/Badge';

export const UserMenu: React.FC = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 p-1.5 rounded-full hover:bg-[#F4F4F5] transition-colors"
      >
        <Avatar name={user.name} className="w-8 h-8" />
        <div className="text-left hidden md:block">
          <div className="text-xs font-semibold text-[#18181B] leading-tight">{user.name}</div>
          <div className="text-[11px] text-[#71717A] capitalize">{user.role.name}</div>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-[#71717A]" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white border border-[#E4E4E7] rounded-2xl shadow-xl py-2 z-50 animate-in fade-in-0 zoom-in-95 duration-100">
          <div className="px-4 py-2 border-b border-[#E4E4E7]">
            <div className="text-xs font-semibold text-black">{user.name}</div>
            <div className="text-[11px] text-[#71717A] truncate">{user.email}</div>
            <Badge variant="mint" size="sm" className="mt-1.5 uppercase text-[10px]">
              {user.role.slug}
            </Badge>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              logout();
            }}
            className="w-full px-4 py-2.5 text-xs text-[#DC2626] hover:bg-[#FEE2E2]/50 flex items-center gap-2 transition-colors font-medium text-left"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};
