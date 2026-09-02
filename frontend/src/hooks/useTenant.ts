import { useAuth } from '../features/auth/hooks/useAuth';
import type { Tenant } from '../types/auth.types';

export function useTenant(): { tenant: Tenant | undefined; isSuperAdmin: boolean } {
  const { user } = useAuth();
  return {
    tenant: user?.tenant,
    isSuperAdmin: user?.role.slug === 'super_admin',
  };
}
