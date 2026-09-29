import { apiClient } from './api-client';
import { ApiError, type ApiResponse } from '../types/api.types';
import type { Tenant } from '../types/auth.types';
import { unwrapList } from '../lib/utils';

// Bumped so a cache already poisoned with the demo tenant list is discarded.
const STORAGE_KEY = 'dukanos_tenants_v2';

/**
 * Demo stores, kept only for the "no data anywhere" case.
 *
 * They must never be presented as real: tenant ids are foreign keys, so
 * offering a store that is not in the database makes staff creation fail
 * validation instead of succeeding.
 */
export const INITIAL_TENANTS: Tenant[] = [
  {
    id: 1,
    name: 'Punjab Electric Store',
    slug: 'punjab-electric-store',
    city: 'Lahore',
    phone: '+92 300 4125678',
    email: 'contact@punjabelectric.pk',
    currency: 'PKR',
    timezone: 'Asia/Karachi',
    status: 'active',
    created_at: '2026-08-01',
  },
];

function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}

/**
 * Fields the provisioning form adds on top of the tenant record itself.
 *
 * The owner account is what makes a new store usable: login matches on
 * users.email, so a tenant created without one rejects every credential.
 */
export interface CreateTenantInput {
  owner_name?: string;
  owner_email?: string;
  owner_password?: string;
  owner_password_confirmation?: string;
}

/**
 * The last known list, used only when the backend is unreachable.
 *
 * Returns an empty list rather than inventing stores — a dropdown that
 * silently offers non-existent records is worse than an empty one.
 */
function getStoredTenants(): Tenant[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveStoredTenants(tenants: Tenant[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tenants));
  } catch (err) {
    console.error('Failed to save tenants to localStorage', err);
  }
}

export const tenantService = {
  async getAll(): Promise<ApiResponse<Tenant[]>> {
    try {
      // The endpoint is paginated, so the rows arrive inside a { data: [...] }
      // envelope. Reading res.data as an array silently failed and served the
      // demo tenant list below, which offered stores that do not exist — picking
      // one made staff creation fail validation on tenant_id.
      const res = await apiClient.get<unknown>('/tenants');
      const list = unwrapList<Tenant>(res?.data);

      if (list.length > 0) {
        saveStoredTenants(list);
        return { ...res, data: list };
      }
    } catch (err) {
      if (isApiError(err)) throw err;
    }

    // Only a genuinely unreachable backend may fall back to storage, and that
    // cache must not be able to invent stores the platform does not have.
    return { data: getStoredTenants(), status: 200, message: 'Loaded from storage' };
  },

  async create(data: Partial<Tenant> & CreateTenantInput): Promise<ApiResponse<Tenant>> {
    const currentTenants = getStoredTenants();
    const newId = currentTenants.length > 0 ? Math.max(...currentTenants.map((t) => t.id)) + 1 : 1;

    const newTenant: Tenant = {
      id: newId,
      name: data.name || '',
      slug: data.slug || data.name?.toLowerCase().replace(/[^a-z0-9]/g, '-') || `tenant-${newId}`,
      email: data.email || undefined,
      phone: data.phone || undefined,
      address: data.address || undefined,
      city: data.city || 'Lahore',
      currency: data.currency || 'PKR',
      timezone: data.timezone || 'Asia/Karachi',
      status: data.status || 'active',
      created_at: new Date().toISOString().split('T')[0],
    };

    try {
      const res = await apiClient.post<Tenant>('/tenants', data);
      if (res && res.data) {
        const saved = res.data;
        const updated = [saved, ...currentTenants.filter((t) => t.id !== saved.id)];
        saveStoredTenants(updated);
        return res;
      }
    } catch (err) {
      // A 422 means the store was rejected (duplicate slug, invalid payload).
      // Reporting success here would fake a tenant that does not exist.
      if (isApiError(err)) throw err;
    }

    // Only a genuinely unreachable backend gets an offline record, and it is
    // flagged so the caller does not claim the store was provisioned.
    const updated = [newTenant, ...currentTenants];
    saveStoredTenants(updated);

    return {
      success: false,
      message: 'Backend unreachable — store not provisioned.',
      data: newTenant,
    };
  },

  async delete(id: number): Promise<ApiResponse<void>> {
    try {
      await apiClient.delete<void>(`/tenants/${id}`);
    } catch (err) {
      // A refused delete (403/404/422) must not be reported as a removal.
      if (isApiError(err)) throw err;
    }

    const currentTenants = getStoredTenants();
    const filtered = currentTenants.filter((t) => t.id !== id);
    saveStoredTenants(filtered);

    return {
      success: true,
      message: 'Tenant deleted successfully',
    };
  },

  /**
   * Suspend or reactivate a store.
   *
   * Uses the dedicated status endpoint: apiResource's PUT validates the whole
   * record and rejects a status-only body because name and slug are required.
   * The server response is returned as-is so the UI never reports a status the
   * platform did not actually persist.
   */
  async toggleStatus(id: number, status: 'active' | 'suspended'): Promise<ApiResponse<Tenant>> {
    const res = await apiClient.patch<Tenant>(`/tenants/${id}/status`, { status });
    const saved = res.data;

    if (saved) {
      saveStoredTenants(
        getStoredTenants().map((t) => (t.id === id ? { ...t, ...saved } : t))
      );
    }

    return res;
  },
};
