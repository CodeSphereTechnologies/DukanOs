import { apiClient } from './api-client';
import { ApiError, type ApiResponse } from '../types/api.types';
import type { StoreUser } from '../types/user.types';
import type { RoleSlug, Tenant } from '../types/auth.types';

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
    tenant_id: r.tenant_id != null ? Number(r.tenant_id) : undefined,
    tenant: r.tenant
      ? ({ ...(r.tenant as Record<string, unknown>), id: Number((r.tenant as Record<string, unknown>).id) } as unknown as Tenant)
      : undefined,
    created_at: String(r.created_at ?? new Date().toISOString()),
    // Only meaningful on the create response; preserved so the caller can
    // react to a failed invitation send.
    ...(r.invitation_sent === false
      ? { invitation_sent: false, temporary_password: String(r.temporary_password ?? '') }
      : {}),
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

/**
 * A local-storage fallback may only stand in for a genuinely unreachable
 * backend. A real API response (401/403/404/422/5xx) must surface as an error,
 * otherwise the UI reports a staff member was created when nothing was
 * persisted and no invitation email was ever sent.
 */
function isApiError(err: unknown): boolean {
  return err instanceof ApiError;
}

export const userService = {
  async getAll(params?: { tenantId?: number }): Promise<ApiResponse<StoreUser[]>> {
    try {
      const res = await apiClient.get<unknown>(
        '/users',
        params?.tenantId ? { tenant_id: params.tenantId } : undefined
      );
      const payload = (res?.data ?? {}) as Record<string, unknown>;
      const list = Array.isArray(payload.data) ? payload.data : [];
      const users = list.map(mapStoreUser);
      saveStoredUsers(users);
      return { success: true, message: 'Users retrieved', data: users };
    } catch (err) {
      if (isApiError(err)) throw err;
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
    tenant_id?: number;
  }): Promise<ApiResponse<StoreUser>> {
    const users = getStoredUsers();
    const body: Record<string, unknown> = {
      name: userPayload.name.trim(),
      email: userPayload.email.trim().toLowerCase(),
      phone: userPayload.phone?.trim() || undefined,
      role: userPayload.role_slug,
      status: userPayload.status || 'active',
      password: userPayload.password,
    };

    // Super admins have no tenant of their own, so they must target a store.
    if (userPayload.tenant_id) {
      body.tenant_id = userPayload.tenant_id;
    }

    try {
      const res = await apiClient.post<unknown>('/users', body);
      const savedUser = mapStoreUser(res.data);
      saveStoredUsers([savedUser, ...users.filter((u) => u.id !== savedUser.id)]);
      return { ...res, data: savedUser };
    } catch (err) {
      if (isApiError(err)) throw err;

      // Backend unreachable: keep a local record so the UI stays usable offline.
      // Nothing was persisted server-side and no invitation went out, so the
      // record is flagged to keep the caller from claiming onboarding finished.
      const roleMeta = ROLES_CONFIG[userPayload.role_slug] || ROLES_CONFIG.cashier;
      const newUser: StoreUser = {
        id: Date.now(),
        name: userPayload.name.trim(),
        email: userPayload.email.trim().toLowerCase(),
        phone: userPayload.phone?.trim() || undefined,
        status: userPayload.status || 'active',
        role: { id: roleMeta.id, name: roleMeta.name, slug: roleMeta.slug },
        created_at: new Date().toISOString(),
        invitation_sent: false,
        temporary_password: userPayload.password,
      };
      saveStoredUsers([newUser, ...users]);
      return {
        data: newUser,
        status: 201,
        message: 'Staff member saved locally (backend unreachable)',
      };
    }
  },

  async toggleStatus(id: number, status: 'active' | 'inactive'): Promise<ApiResponse<StoreUser>> {
    try {
      const res = await apiClient.patch<unknown>(`/users/${id}/status`, { status });
      const saved = mapStoreUser(res.data);
      saveStoredUsers(getStoredUsers().map((u) => (u.id === id ? saved : u)));
      return { ...res, data: saved };
    } catch (err) {
      if (isApiError(err)) throw err;
    }
    const users = getStoredUsers();
    const updated = users.map((u) => (u.id === id ? { ...u, status } : u));
    saveStoredUsers(updated);
    return {
      data: updated.find((u) => u.id === id)!,
      status: 200,
      message: 'Status updated locally (backend unreachable)',
    };
  },

  async delete(id: number): Promise<ApiResponse<boolean>> {
    try {
      await apiClient.delete(`/users/${id}`);
    } catch (err) {
      if (isApiError(err)) throw err;
    }

    saveStoredUsers(getStoredUsers().filter((u) => u.id !== id));
    return { data: true, status: 200, message: 'User deleted' };
  },
};
