import React from 'react';
import { Outlet } from 'react-router-dom';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-[#000000] text-white flex flex-col justify-between selection:bg-[#C1FBD4] selection:text-black">
      {/* Brand Header */}
      <div className="p-6 sm:p-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white text-black rounded-xl flex items-center justify-center font-bold text-lg font-display">
            D
          </div>
          <span className="font-bold text-xl tracking-tight font-display text-white">
            Dukan<span className="text-[#C1FBD4]">OS</span>
          </span>
        </div>
        <div className="text-xs text-neutral-400 font-mono">v1.0-release</div>
      </div>

      {/* Main Form Center */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-xs text-neutral-500 border-t border-neutral-900">
        DukanOS Multi-Tenant Appliance & Electrical Operating System
      </footer>
    </div>
  );
};
