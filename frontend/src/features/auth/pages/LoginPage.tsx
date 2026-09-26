import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/LoginForm';
import { useAuth } from '../hooks/useAuth';
import { ROLE_DASHBOARDS } from '../../../lib/constants';
import type { LoginCredentials } from '../../../types/auth.types';

export const LoginPage: React.FC = () => {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (credentials: LoginCredentials) => {
    const user = await login(credentials);
    const target = ROLE_DASHBOARDS[user.role.slug] || '/dashboard';
    navigate(target);
  };

  return (
    <div className="flex flex-col w-full animate-in fade-in slide-in-from-bottom-4 duration-1000 items-center justify-center h-full">
      
      {/* Top Logo - Bigger and Animated */}
      <div className="flex justify-center mb-10">
        <div className="relative group cursor-pointer">
          <div className="absolute inset-0 bg-[#059669]/10 blur-2xl rounded-full scale-0 group-hover:scale-[1.8] transition-transform duration-700 ease-out"></div>
          <img 
            src="/logo-light-rect-nobg.png" 
            alt="DukanOS" 
            className="relative h-20 sm:h-28 object-contain hover:scale-105 transition-transform duration-500 ease-out" 
          />
        </div>
      </div>

      {/* Header Text */}
      <div className="text-center space-y-3 mb-10">
        <h1 className="text-4xl sm:text-[44px] leading-tight font-serif text-[#18181B] tracking-tight">
          Welcome Back
        </h1>
        <h2 className="text-2xl text-[#059669] font-urdu leading-none" style={{ fontFamily: "'Noto Nastaliq Urdu', serif" }} dir="rtl">
          خوش آمدید
        </h2>
        <p className="text-[13px] text-neutral-500 font-medium px-4 pt-2">
          Enter your email and password to access your account
        </p>
      </div>

      {/* Form Area */}
      <div className="w-full mx-auto max-w-[360px]">
        <LoginForm onSubmit={handleLogin} isLoading={isLoading} />
        
        <div className="mt-8 text-center pb-4">
            <p className="text-sm text-neutral-500 font-medium">
                Don't have an account? <span className="font-bold text-[#18181B] cursor-pointer hover:text-[#059669] hover:underline transition-all">Sign Up</span>
            </p>
        </div>
      </div>
    </div>
  );
};
