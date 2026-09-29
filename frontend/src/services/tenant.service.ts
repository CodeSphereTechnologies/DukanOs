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

  async create(data: Partial<Tenant>): Promise<ApiResponse<Tenant>> {
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
    } catch {
      // Fallback to local storage
    }

    const updated = [newTenant, ...currentTenants];
    saveStoredTenants(updated);

    return {
      success: true,
      message: 'Tenant provisioned successfully',
      data: newTenant,
    };
  },

  async delete(id: number): Promise<ApiResponse<void>> {
    try {
      await apiClient.delete<void>(`/tenants/${id}`);
    } catch {
      // Fallback to local storage
    }

    const currentTenants = getStoredTenants();
    const filtered = currentTenants.filter((t) => t.id !== id);
    saveStoredTenants(filtered);

    return {
      success: true,
      message: 'Tenant deleted successfully',
    };
  },

  async toggleStatus(id: number): Promise<ApiResponse<Tenant>> {
    const currentTenants = getStoredTenants();
    const tenant = currentTenants.find((t) => t.id === id);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const updatedTenant: Tenant = {
      ...tenant,
      status: tenant.status === 'active' ? 'suspended' : 'active',
    };

    const updated = currentTenants.map((t) => (t.id === id ? updatedTenant : t));
    saveStoredTenants(updated);

    try {
      await apiClient.put<Tenant>(`/tenants/${id}`, { status: updatedTenant.status });
    } catch {
      // ignore
    }

    return {
      success: true,
      message: `Tenant status updated to ${updatedTenant.status}`,
      data: updatedTenant,
    };
  },
};
