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
    <div className="flex flex-col w-full animate-in fade-in slide-in-from-bottom-4 duration-1000 items-center justify-center min-h-full">
      
      {/* Top Logo - Lower and Even Bigger */}
      <div className="flex justify-center mb-6 sm:mb-16">
        <div className="relative group cursor-pointer">
          <div className="absolute inset-0 bg-[#059669]/10 blur-2xl rounded-full scale-0 group-hover:scale-[1.8] transition-transform duration-700 ease-out"></div>
          <img 
            src="/logo-light-rect-nobg.png" 
            alt="DukanOS" 
            className="relative h-24 sm:h-32 object-contain hover:scale-105 transition-transform duration-500 ease-out" 
          />
        </div>
      </div>

      {/* Header Text */}
      <div className="text-center space-y-2 mb-10">
        <h2 className="text-5xl sm:text-6xl text-[#059669] font-urdu leading-none" style={{ fontFamily: "'Noto Nastaliq Urdu', serif" }} dir="rtl">
          خوش آمدید
        </h2>
        <p className="text-[14px] text-neutral-500 font-medium px-4 pt-4">
          Enter your email and password to access your account
        </p>
      </div>

      {/* Form Area */}
      <div className="w-full mx-auto max-w-[360px]">
        <LoginForm onSubmit={handleLogin} isLoading={isLoading} />
        
        
      </div>
    </div>
  );
};
