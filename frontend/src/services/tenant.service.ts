import { apiClient } from './api-client';
import type { ApiResponse } from '../types/api.types';
import type { Tenant } from '../types/auth.types';

const STORAGE_KEY = 'dukanos_tenants';

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
  {
    id: 2,
    name: 'Karachi Appliances Mall',
    slug: 'karachi-appliances-mall',
    city: 'Karachi',
    phone: '+92 321 8899112',
    email: 'info@karachiappliances.pk',
    currency: 'PKR',
    timezone: 'Asia/Karachi',
    status: 'active',
    created_at: '2026-08-15',
  },
  {
    id: 3,
    name: 'Islamabad Power & Light',
    slug: 'isb-power-light',
    city: 'Islamabad',
    phone: '+92 333 5556677',
    email: 'support@isbpower.pk',
    currency: 'PKR',
    timezone: 'Asia/Karachi',
    status: 'suspended',
    created_at: '2026-08-20',
  },
];

function getStoredTenants(): Tenant[] {
  if (typeof window === 'undefined') return INITIAL_TENANTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_TENANTS));
      return INITIAL_TENANTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_TENANTS;
  } catch {
    return INITIAL_TENANTS;
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
      const res = await apiClient.get<Tenant[]>('/tenants');
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        saveStoredTenants(res.data);
        return res;
      }
    } catch {
      // Fallback to local storage
    }

    const localData = getStoredTenants();
    return {
      success: true,
      message: 'Tenants retrieved successfully',
      data: localData,
    };
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
