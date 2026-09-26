import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Zap, Store } from 'lucide-react';
import { useAuth } from '../features/auth/hooks/useAuth';

export const POSLayout: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* POS Top Bar */}
      <header className="h-16 bg-black text-white px-4 flex items-center justify-between shrink-0 print:hidden relative">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="text-white hover:bg-neutral-800 h-8 px-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Dashboard
          </Button>
          <div className="h-4 w-px bg-neutral-800" />
          <span className="font-bold text-sm tracking-tight font-display">
            POS Counter <span className="text-[#C1FBD4]">· Terminal 01</span>
          </span>
        </div>


        {/* Center Logo & Vendor */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-4 hidden md:flex">
          <img src="/logo-dark-rect-nobg.png" alt="DukanOS" className="h-16 object-contain" />
          <div className="h-5 w-px bg-neutral-800" />
          <div className="flex items-center gap-2 bg-neutral-900/50 pr-3 pl-1.5 py-1.5 rounded-lg border border-neutral-800/50">
            <div className="w-6 h-6 rounded bg-[#059669]/20 text-[#C1FBD4] flex items-center justify-center">
              <Store className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-[13px] text-white tracking-tight">{user?.tenant?.name || 'Vendor'}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="px-2.5 py-1 bg-neutral-800 rounded-full text-white font-medium flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-[#C1FBD4]" />
            {user?.name}
          </span>
        </div>
      </header>

      {/* POS Main Content */}
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
};
