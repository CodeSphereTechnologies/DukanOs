import React, { useState } from 'react';
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
