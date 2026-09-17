import React, { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { FormField } from '../../../components/ui/FormField';
import { Alert } from '../../../components/ui/Alert';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import type { LoginCredentials } from '../../../types/auth.types';

export interface LoginFormProps {
  onSubmit: (credentials: LoginCredentials) => Promise<void>;
  isLoading?: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSubmit, isLoading = false }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <form onSubmit={handleSubmit} noValidate className="w-full space-y-4">
      {errors.general && (
        <Alert type="error" onClose={() => setErrors((prev) => ({ ...prev, general: undefined }))}>
          {errors.general}
        </Alert>
      )}

      <FormField label="Email Address" required error={errors.email} labelClassName="text-[#e5e5e5]">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@punjabelectric.pk"
          disabled={isLoading}
          leftIcon={<Mail className="w-4 h-4" />}
          autoComplete="email"
          autoFocus
        />
      </FormField>

      <FormField label="Password" required error={errors.password} labelClassName="text-[#e5e5e5]">
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          disabled={isLoading}
          leftIcon={<Lock className="w-4 h-4" />}
          autoComplete="current-password"
        />
      </FormField>

      <div className="pt-2">
        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isLoading}
          className="w-full bg-white text-black hover:bg-[#F4F4F5] hover:text-black font-semibold"
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Sign In to DukanOS
        </Button>
      </div>
    </form>
  );
};
