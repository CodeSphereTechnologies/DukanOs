import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Zap } from 'lucide-react';
import { useAuth } from '../features/auth/hooks/useAuth';

export const POSLayout: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* POS Top Bar */}
      <header className="h-14 bg-black text-white px-4 flex items-center justify-between shrink-0 print:hidden">
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

        <div className="flex items-center gap-3 text-xs">
          {user?.tenant && (
            <span className="text-neutral-400 hidden sm:inline">{user.tenant.name}</span>
          )}
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
