import os

# --- AuthLayout.tsx ---
auth_layout_code = """import React from 'react';
import { Outlet } from 'react-router-dom';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-[#060608] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* 2-Column White Card Container */}
      <div className="w-full max-w-[1200px] h-[calc(100vh-32px)] sm:h-[calc(100vh-64px)] min-h-[600px] max-h-[850px] bg-white rounded-[32px] sm:rounded-[40px] shadow-2xl overflow-hidden flex flex-col lg:flex-row p-2 sm:p-3 gap-3">
        
        {/* Left Column (Image & Overlay) */}
        <div className="relative hidden lg:flex flex-col w-1/2 rounded-[24px] sm:rounded-[32px] overflow-hidden p-10 justify-between items-start group">
          <img 
            src="/hero-v2.jpg"
            alt="DukanOS Background" 
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/90 mix-blend-multiply"></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-[#059669]/20 to-transparent mix-blend-overlay"></div>
          
          {/* Top Line */}
          <div className="relative z-10 w-full flex items-center gap-4">
             <span className="text-[11px] font-bold tracking-[0.2em] text-white/90 uppercase">A Wise Choice</span>
             <div className="h-px bg-white/20 flex-1"></div>
          </div>

          {/* Bottom Text */}
          <div className="relative z-10 text-white w-full">
            <h1 className="text-4xl xl:text-[56px] font-bold leading-[1.05] font-serif tracking-tight mb-5">
              Get<br/>Everything<br/>You Want
            </h1>
            <p className="text-sm text-white/70 max-w-sm leading-relaxed">
              You can get everything you want if you work hard, trust the process, and stick to the plan.
            </p>
          </div>
        </div>

        {/* Right Column (Form) */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 lg:p-12 xl:p-16 bg-white overflow-y-auto overflow-x-hidden scrollbar-none">
          <div className="w-full max-w-[360px]">
            <Outlet />
          </div>
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
"""

with open('frontend/src/features/auth/pages/LoginPage.tsx', 'w') as f:
    f.write(login_page_code)

# --- LoginForm.tsx ---
login_form_code = """import React, { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Alert } from '../../../components/ui/Alert';
import { Eye, EyeOff } from 'lucide-react';
import type { LoginCredentials } from '../../../types/auth.types';

export interface LoginFormProps {
  onSubmit: (credentials: LoginCredentials) => Promise<void>;
  isLoading?: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSubmit, isLoading = false }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      newErrors.password = 'Password is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validate()) return;

    try {
      await onSubmit({ email, password });
    } catch (err) {
      setErrors({
        general: err instanceof Error ? err.message : 'Invalid credentials. Please try again.',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="w-full space-y-5">
      {errors.general && (
        <Alert type="error" onClose={() => setErrors((prev) => ({ ...prev, general: undefined }))}>
          {errors.general}
        </Alert>
      )}

      {/* Custom Input Field: Email */}
      <div className="space-y-2">
        <label className="block text-[13px] font-bold text-[#18181B] pl-1">Email</label>
        <div className="relative">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            disabled={isLoading}
            autoComplete="email"
            autoFocus
            className={`w-full h-12 px-4 rounded-xl bg-[#F4F4F5] border-transparent focus:bg-white focus:border-[#C1FBD4] focus:ring-2 focus:ring-[#C1FBD4]/20 text-[14px] text-[#18181B] placeholder:text-neutral-400 transition-all outline-none font-medium ${errors.email ? 'ring-1 ring-red-500 bg-red-50' : ''}`}
          />
        </div>
        {errors.email && <p className="text-[11px] text-red-500 font-medium pl-1">{errors.email}</p>}
      </div>

      {/* Custom Input Field: Password */}
      <div className="space-y-2">
        <label className="block text-[13px] font-bold text-[#18181B] pl-1">Password</label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            disabled={isLoading}
            autoComplete="current-password"
            className={`w-full h-12 pl-4 pr-11 rounded-xl bg-[#F4F4F5] border-transparent focus:bg-white focus:border-[#C1FBD4] focus:ring-2 focus:ring-[#C1FBD4]/20 text-[14px] text-[#18181B] placeholder:text-neutral-400 transition-all outline-none font-medium ${errors.password ? 'ring-1 ring-red-500 bg-red-50' : ''}`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors p-1"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.password && <p className="text-[11px] text-red-500 font-medium pl-1">{errors.password}</p>}
      </div>

      {/* Extras Row */}
      <div className="flex items-center justify-between pt-1 pb-4 pl-1">
        <label className="flex items-center gap-2 cursor-pointer group">
          <input type="checkbox" className="w-3.5 h-3.5 rounded-sm border-neutral-300 text-[#059669] focus:ring-[#059669] cursor-pointer" />
          <span className="text-[12px] font-semibold text-neutral-500 group-hover:text-neutral-800 transition-colors">Remember me</span>
        </label>
        <a href="#" className="text-[12px] font-semibold text-neutral-500 hover:text-[#059669] transition-colors">
          Forgot Password
        </a>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        size="md"
        isLoading={isLoading}
        className="w-full h-12 bg-black text-white hover:bg-neutral-800 hover:text-white rounded-xl font-semibold text-[14px] shadow-lg shadow-black/10 transition-all active:scale-[0.98]"
      >
        Sign In
      </Button>
    </form>
  );
};
"""

with open('frontend/src/features/auth/components/LoginForm.tsx', 'w') as f:
    f.write(login_form_code)

