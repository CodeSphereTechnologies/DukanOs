# --- AuthLayout.tsx ---
auth_layout_code = """import React from 'react';
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
"""

with open('frontend/src/layouts/AuthLayout.tsx', 'w') as f:
    f.write(auth_layout_code)

# --- LoginPage.tsx ---
login_page_code = """import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/LoginForm';
import { DemoAccountPicker } from '../components/DemoAccountPicker';
import { useAuth } from '../hooks/useAuth';
import { ROLE_DASHBOARDS } from '../../../lib/constants';
import type { LoginCredentials } from '../../../types/auth.types';

export const LoginPage: React.FC = () => {
  const { login, switchUserRole, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (credentials: LoginCredentials) => {
    const user = await login(credentials);
    const target = ROLE_DASHBOARDS[user.role.slug] || '/dashboard';
    navigate(target);
  };

  const handleDemoSelect = async (email: string) => {
    const user = await switchUserRole(email);
    const target = ROLE_DASHBOARDS[user.role.slug] || '/dashboard';
    navigate(target);
  };

  return (
    <div className="flex flex-col w-full animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* Top Logo - Bigger and Animated */}
      <div className="flex justify-center mb-16">
        <div className="relative group cursor-pointer">
          <div className="absolute inset-0 bg-[#059669]/10 blur-xl rounded-full scale-0 group-hover:scale-[1.8] transition-transform duration-700 ease-out"></div>
          <img 
            src="/logo-dark-rect-nobg.png" 
            alt="DukanOS" 
            className="relative h-12 sm:h-14 object-contain hover:scale-105 transition-transform duration-500 ease-out" 
          />
        </div>
      </div>

      {/* Header Text */}
      <div className="text-center space-y-4 mb-12">
        <h1 className="text-4xl sm:text-5xl leading-tight font-serif text-[#18181B] tracking-tight">
          Welcome Back
        </h1>
        <p className="text-sm text-neutral-500 font-medium px-4">
          Enter your email and password to access your account
        </p>
      </div>

      {/* Form Area */}
      <div className="w-full mx-auto">
        <LoginForm onSubmit={handleLogin} isLoading={isLoading} />
        
        <div className="mt-8 pt-6 border-t border-neutral-100">
            <DemoAccountPicker onSelectAccount={handleDemoSelect} isLoading={isLoading} />
        </div>

        <div className="mt-10 text-center pb-8">
            <p className="text-sm text-neutral-500 font-medium">
                Don't have an account? <span className="font-bold text-[#18181B] cursor-pointer hover:text-[#059669] hover:underline transition-all">Sign Up</span>
            </p>
        </div>
      </div>
    </div>
  );
};
"""

with open('frontend/src/features/auth/pages/LoginPage.tsx', 'w') as f:
    f.write(login_page_code)
