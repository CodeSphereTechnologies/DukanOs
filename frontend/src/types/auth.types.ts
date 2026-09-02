export type RoleSlug = 'super_admin' | 'owner' | 'manager' | 'cashier' | 'accountant';

export interface Role {
  id: number;
  name: string;
  slug: RoleSlug;
  description?: string;
  permissions?: Permission[];
}

export interface Permission {
  id: number;
  name: string;
  slug: string;
  group: string;
}

export interface Tenant {
  id: number;
  name: string;
  slug: string;
  logo?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  currency: string;
  timezone: string;
  status: 'active' | 'suspended' | 'inactive';
  created_at?: string;
}

export interface User {
  id: number;
  tenant_id?: number;
  role_id?: number;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  status: 'active' | 'inactive';
  role: Role;
  tenant?: Tenant;
  permissions: string[];
}

export interface LoginCredentials {
  email: string;
  password: string;
  tenant_slug?: string;
}

export interface LoginResponseData {
  user: User;
  token: string;
}
