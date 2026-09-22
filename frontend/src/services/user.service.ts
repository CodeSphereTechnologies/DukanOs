import { apiClient } from './api-client';
import type { ApiResponse } from '../types/api.types';
import type { StoreUser } from '../types/user.types';
import type { RoleSlug } from '../types/auth.types';

export const STORAGE_KEY_USERS = 'dukanos_users_v2';

export const ROLES_CONFIG: Record<RoleSlug, { id: number; name: string; slug: RoleSlug; description: string }> = {
  owner: { id: 2, name: 'Store Owner', slug: 'owner', description: 'Full store administrative and financial control' },
  manager: { id: 3, name: 'Store Manager', slug: 'manager', description: 'Catalog inventory, pricing, quotations, and staff oversight' },
  cashier: { id: 4, name: 'POS Cashier', slug: 'cashier', description: 'Register sales counter, billing, and returns' },
  accountant: { id: 5, name: 'Store Accountant', slug: 'accountant', description: 'General ledger, receivables, vasooli recoveries, and expenses' },
  super_admin: { id: 1, name: 'Super Admin', slug: 'super_admin', description: 'Platform multi-tenant infrastructure admin' },
};

export const INITIAL_USERS: StoreUser[] = [];

function mapStoreUser(raw: unknown): StoreUser {
  const r = (raw ?? {}) as Record<string, unknown>;
  const role = (r.role ?? {}) as Record<string, unknown>;
  return {
    id: Number(r.id ?? 0),
    name: String(r.name ?? ''),
    email: String(r.email ?? ''),
    phone: r.phone != null ? String(r.phone) : undefined,
    status: (r.status === 'inactive' ? 'inactive' : 'active') as StoreUser['status'],
    role: {
      id: Number(role.id ?? 1),
      name: String(role.name ?? 'Staff'),
      slug: (role.slug ?? 'cashier') as StoreUser['role']['slug'],
    },
    created_at: String(r.created_at ?? new Date().toISOString()),
  };
}

function getStoredUsers(): StoreUser[] {
  if (typeof window === 'undefined') return INITIAL_USERS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_USERS;
  } catch {
    return INITIAL_USERS;
  }
}

function saveStoredUsers(users: StoreUser[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  } catch {
    // ignore
  }
}

export const userService = {
  async getAll(): Promise<ApiResponse<StoreUser[]>> {
    try {
      const res = await apiClient.get<unknown>('/users');
      const payload = (res?.data ?? {}) as Record<string, unknown>;
      const list = Array.isArray(payload.data) ? payload.data : [];
      const users = list.map(mapStoreUser);
      saveStoredUsers(users);
      return { success: true, message: 'Users retrieved', data: users };
    } catch {
      // offline fallback
    }
    return { data: getStoredUsers(), status: 200, message: 'Loaded from storage' };
  },

  async create(userPayload: {
    name: string;
    email: string;
    phone?: string;
    role_slug: RoleSlug;
    status?: 'active' | 'inactive';
    password?: string;
  }): Promise<ApiResponse<StoreUser>> {
    const roleMeta = ROLES_CONFIG[userPayload.role_slug] || ROLES_CONFIG.cashier;
    const users = getStoredUsers();
    
    const newUser: StoreUser = {
      id: Date.now(),
      name: userPayload.name.trim(),
      email: userPayload.email.trim().toLowerCase(),
      phone: userPayload.phone?.trim() || undefined,
      status: userPayload.status || 'active',
      role: {
        id: roleMeta.id,
        name: roleMeta.name,
        slug: roleMeta.slug,
      },
      created_at: new Date().toISOString(),
    };

    try {
      const res = await apiClient.post<StoreUser>('/users', {
        name: userPayload.name.trim(),
        email: userPayload.email.trim().toLowerCase(),
        phone: userPayload.phone?.trim() || undefined,
        role: userPayload.role_slug,
        status: userPayload.status || 'active',
        password: userPayload.password,
      });
      if (res && res.data) {
        const savedUser = res.data;
        const updated = [savedUser, ...users.filter((u) => u.id !== savedUser.id)];
        saveStoredUsers(updated);
        return res;
      }
    } catch {
      // offline fallback
    }

    const updated = [newUser, ...users];
    saveStoredUsers(updated);
    return { data: newUser, status: 201, message: 'Staff member invited successfully' };
  },

  async toggleStatus(id: number): Promise<ApiResponse<StoreUser>> {
    const users = getStoredUsers();
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) {
      throw new Error('Staff member not found');
    }

    const target = users[idx];
    const newStatus: 'active' | 'inactive' = target.status === 'active' ? 'inactive' : 'active';
    const updatedUser: StoreUser = { ...target, status: newStatus };

    try {
      const res = await apiClient.put<StoreUser>(`/users/${id}/status`, { status: newStatus });
      if (res && res.data) {
        users[idx] = res.data;
        saveStoredUsers(users);
        return res;
      }
    } catch {
      // offline fallback
    }

    users[idx] = updatedUser;
    saveStoredUsers(users);
    return { data: updatedUser, status: 200, message: 'Status updated successfully' };
  },

  async delete(id: number): Promise<ApiResponse<boolean>> {
    const users = getStoredUsers();
    const filtered = users.filter((u) => u.id !== id);
    saveStoredUsers(filtered);

    try {
      await apiClient.delete(`/users/${id}`);
    } catch {
      // offline fallback
    }

    return { data: true, status: 200, message: 'User deleted' };
  },
};
