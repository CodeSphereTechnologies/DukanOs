import React from 'react';
import { Outlet } from 'react-router-dom';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-white flex flex-col lg:flex-row overflow-hidden">
      
      {/* Left Column (Image & Overlay) - Full Height */}
      <div className="relative hidden lg:flex flex-col w-1/2 min-h-screen overflow-hidden p-12 xl:p-16 justify-between items-start group">
        <img 
          src="/hero-v2.jpg"
          alt="DukanOS Background" 
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-[20s] ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/90 mix-blend-multiply"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-[#059669]/30 to-transparent mix-blend-overlay"></div>
        
        {/* Top Line */}
        <div className="relative z-10 w-full flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-1000 delay-300 fill-mode-both">
           <span className="text-[11px] font-bold tracking-[0.2em] text-white/90 uppercase">A Wise Choice</span>
           <div className="h-px bg-white/20 flex-1"></div>
        </div>

        {/* Bottom Text */}
        <div className="relative z-10 text-white w-full animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500 fill-mode-both">
          <h1 className="text-5xl xl:text-[72px] font-bold leading-[1.05] font-serif tracking-tight mb-6 drop-shadow-lg">
            Get<br/>Everything<br/>You Want
          </h1>
          <p className="text-base text-white/80 max-w-sm leading-relaxed drop-shadow-md">
            You can get everything you want if you work hard, trust the process, and stick to the plan.
          </p>
        </div>
      </div>

      {/* Right Column (Form) */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 lg:p-16 xl:p-24 bg-white min-h-screen overflow-y-auto">
        <div className="w-full max-w-[420px] py-10">
          <Outlet />
        </div>
      </div>
      
    </div>
  );
};
