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
    <div className="space-y-6">
      <div className="text-center space-y-4 flex flex-col items-center">
        <img src="/logo-light-rect-nobg.png" alt="DukanOS" className="h-10 object-contain mx-auto mb-2" />
        <h1 className="text-2xl font-bold tracking-tight text-white font-display">
          Welcome to DukanOS
        </h1>
        <p className="text-xs text-neutral-400">
          Enter credentials or choose a seeded role to access your workspace.
        </p>
      </div>

      <div className="bg-neutral-950 border border-neutral-800 p-6 sm:p-8 rounded-2xl space-y-6">
        <LoginForm onSubmit={handleLogin} isLoading={isLoading} />
        <DemoAccountPicker onSelectAccount={handleDemoSelect} isLoading={isLoading} />
      </div>
    </div>
  );
};
