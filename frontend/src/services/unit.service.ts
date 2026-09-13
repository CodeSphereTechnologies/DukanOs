import { apiClient } from './api-client';
import type { ApiResponse } from '../types/api.types';
import type { Unit } from '../types/product.types';

export const STORAGE_KEY_UNITS = 'dukanos_units';

export const INITIAL_UNITS: Unit[] = [
  { id: 1, code: 'pc', name: 'Piece', status: 'active' },
  { id: 2, code: 'coil', name: 'Coil / Roll', status: 'active' },
  { id: 3, code: 'm', name: 'Meter', status: 'active' },
  { id: 4, code: 'box', name: 'Box', status: 'active' },
];

function getStoredUnits(): Unit[] {
  if (typeof window === 'undefined') return INITIAL_UNITS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_UNITS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_UNITS, JSON.stringify(INITIAL_UNITS));
      return INITIAL_UNITS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_UNITS;
  } catch {
    return INITIAL_UNITS;
  }
}

function saveStoredUnits(units: Unit[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_UNITS, JSON.stringify(units));
  } catch {
    // ignore
  }
}

export const unitService = {
  async getAll(): Promise<ApiResponse<Unit[]>> {
    try {
      const res = await apiClient.get<Unit[]>('/units');
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        return res;
      }
    } catch {
      // fallback
    }
    return {
      success: true,
      message: 'Units retrieved',
      data: getStoredUnits(),
    };
  },

  async add(data: { code: string; name: string }): Promise<Unit> {
    const list = getStoredUnits();
    const existing = list.find((u) => u.code.toLowerCase() === data.code.trim().toLowerCase());
    if (existing) return existing;
    const newUnit: Unit = {
      id: list.length > 0 ? Math.max(...list.map((u) => u.id)) + 1 : 1,
      code: data.code.trim().toLowerCase(),
      name: data.name.trim(),
      status: 'active',
    };
    saveStoredUnits([...list, newUnit]);
    return newUnit;
  },

  async update(id: number, data: Partial<Pick<Unit, 'code' | 'name' | 'status'>>): Promise<Unit | null> {
    const list = getStoredUnits();
    const idx = list.findIndex((u) => u.id === id);
    if (idx < 0) return null;
    list[idx] = {
      ...list[idx],
      ...data,
      ...(data.code !== undefined ? { code: data.code.trim().toLowerCase() } : {}),
    };
    saveStoredUnits(list);
    return list[idx];
  },

  async delete(id: number): Promise<boolean> {
    const list = getStoredUnits();
    const next = list.filter((u) => u.id !== id);
    if (next.length === list.length) return false;
    saveStoredUnits(next);
    return true;
  },
};