import type { Role } from './auth.types';

export interface StoreUser {
  id: number;
  tenant_id?: number;
  name: string;
  email: string;
  phone?: string;
  status: 'active' | 'inactive';
  role: Role;
  created_at: string;
}
