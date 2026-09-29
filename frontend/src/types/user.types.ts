import type { Role, Tenant } from './auth.types';

export interface StoreUser {
  id: number;
  tenant_id?: number;
  name: string;
  email: string;
  phone?: string;
  status: 'active' | 'inactive';
  role: Role;
  tenant?: Tenant;
  created_at: string;
  /**
   * Set by the API on create only. `false` means the account exists but its
   * credentials were never emailed, so `temporary_password` must be relayed
   * by hand — it is the only copy the staff member will get.
   */
  invitation_sent?: boolean;
  temporary_password?: string;
}
