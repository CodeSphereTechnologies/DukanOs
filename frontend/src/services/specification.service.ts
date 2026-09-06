import { apiClient } from './api-client';
import type { ApiResponse } from '../types/api.types';
import type { Specification } from '../types/product.types';

const STORAGE_KEY = 'dukanos_specifications';

export const INITIAL_SPECS: Specification[] = [
  { id: 1, name: 'Wattage', slug: 'wattage', data_type: 'number', unit: 'W', is_required: true, is_filterable: true, sort_order: 1, status: 'active' },
  { id: 2, name: 'Voltage Rating', slug: 'voltage', data_type: 'select', unit: 'V', is_required: true, is_filterable: true, sort_order: 2, status: 'active', values: ['220V', '240V', '110V'] },
  { id: 3, name: 'Warranty Period', slug: 'warranty', data_type: 'text', unit: 'Months', is_required: false, is_filterable: true, sort_order: 3, status: 'active' },
  { id: 4, name: 'Blade Sweep Size', slug: 'blade-sweep', data_type: 'select', unit: 'Inches', is_required: true, is_filterable: true, sort_order: 4, status: 'active', values: ['56"', '48"', '36"'] },
  { id: 5, name: 'Energy Star Certified', slug: 'energy-star', data_type: 'boolean', is_required: false, is_filterable: true, sort_order: 5, status: 'active' },
];

function getStoredSpecs(): Specification[] {
  if (typeof window === 'undefined') return INITIAL_SPECS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SPECS));
      return INITIAL_SPECS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_SPECS;
  } catch {
    return INITIAL_SPECS;
  }
}

function saveStoredSpecs(specs: Specification[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(specs));
  } catch (err) {
    console.error('Failed to save specifications to localStorage', err);
  }
}

export const specificationService = {
  async getAll(): Promise<ApiResponse<Specification[]>> {
    try {
      const res = await apiClient.get<Specification[]>('/specifications');
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        saveStoredSpecs(res.data);
        return res;
      }
    } catch {
      // Fallback to local storage
    }

    const localData = getStoredSpecs();
    return {
      success: true,
      message: 'Specifications retrieved successfully',
      data: localData,
    };
  },

  async create(data: Partial<Specification>): Promise<ApiResponse<Specification>> {
    const currentSpecs = getStoredSpecs();
    const newId = currentSpecs.length > 0 ? Math.max(...currentSpecs.map((s) => s.id)) + 1 : 1;

    const newSpec: Specification = {
      id: newId,
      name: data.name || '',
      slug: data.slug || data.name?.toLowerCase().replace(/[^a-z0-9]/g, '-') || `spec-${newId}`,
      data_type: data.data_type || 'text',
      unit: data.unit || undefined,
      is_required: Boolean(data.is_required),
      is_filterable: data.is_filterable !== undefined ? Boolean(data.is_filterable) : true,
      sort_order: data.sort_order ?? (currentSpecs.length + 1),
      status: data.status || 'active',
      values: data.values || undefined,
    };

    try {
      const res = await apiClient.post<Specification>('/specifications', data);
      if (res && res.data) {
        const saved = res.data;
        const updated = [saved, ...currentSpecs.filter((s) => s.id !== saved.id)];
        saveStoredSpecs(updated);
        return res;
      }
    } catch {
      // Fallback to local storage
    }

    const updated = [newSpec, ...currentSpecs];
    saveStoredSpecs(updated);

    return {
      success: true,
      message: 'Specification created successfully',
      data: newSpec,
    };
  },

  async delete(id: number): Promise<ApiResponse<void>> {
    try {
      await apiClient.delete<void>(`/specifications/${id}`);
    } catch {
      // Fallback to local storage
    }

    const currentSpecs = getStoredSpecs();
    const filtered = currentSpecs.filter((s) => s.id !== id);
    saveStoredSpecs(filtered);

    return {
      success: true,
      message: 'Specification deleted successfully',
    };
  },

  async toggleStatus(id: number): Promise<ApiResponse<Specification>> {
    const currentSpecs = getStoredSpecs();
    const spec = currentSpecs.find((s) => s.id === id);
    if (!spec) {
      throw new Error('Specification not found');
    }

    const updatedSpec: Specification = {
      ...spec,
      status: spec.status === 'active' ? 'inactive' : 'active',
    };

    const updated = currentSpecs.map((s) => (s.id === id ? updatedSpec : s));
    saveStoredSpecs(updated);

    try {
      await apiClient.put<Specification>(`/specifications/${id}`, { status: updatedSpec.status });
    } catch {
      // ignore
    }

    return {
      success: true,
      message: `Specification status updated to ${updatedSpec.status}`,
      data: updatedSpec,
    };
  },
};
