import React from 'react';
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
    <div className="flex flex-col h-full">
      
      {/* Top Logo */}
      <div className="flex justify-center mb-16">
        <img src="/logo-dark-rect-nobg.png" alt="DukanOS" className="h-8 object-contain" />
      </div>

      {/* Header Text */}
      <div className="text-center space-y-3 mb-10">
        <h1 className="text-[36px] sm:text-[44px] leading-none font-serif text-[#18181B] tracking-tight">
          Welcome Back
        </h1>
        <p className="text-[13px] text-neutral-500 font-medium">
          Enter your email and password to access your account
        </p>
      </div>

      {/* Form Area */}
      <div className="w-full mx-auto">
        <LoginForm onSubmit={handleLogin} isLoading={isLoading} />
        
        <div className="mt-8 pt-6 border-t border-neutral-100">
            <DemoAccountPicker onSelectAccount={handleDemoSelect} isLoading={isLoading} />
        </div>

        <div className="mt-10 text-center">
            <p className="text-xs text-neutral-500 font-medium">
                Don't have an account? <span className="font-bold text-[#18181B] cursor-pointer hover:underline transition-all">Sign Up</span>
            </p>
        </div>
      </div>
    </div>
  );
};
