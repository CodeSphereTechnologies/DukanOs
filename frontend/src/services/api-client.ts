import { APP_CONFIG } from '../lib/constants';
import { ApiError, type ApiResponse } from '../types/api.types';
import type { User } from '../types/auth.types';
import type { DashboardSummary } from '../types/report.types';

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    this.baseUrl = APP_CONFIG.apiBaseUrl;
    this.token = typeof window !== 'undefined' ? localStorage.getItem(APP_CONFIG.tokenKey) : null;
  }

  public setToken(token: string) {
    this.token = token;
  }

  public removeToken() {
    this.token = null;
  }

  public async get<T>(url: string, params?: Record<string, string | number | boolean | undefined>): Promise<ApiResponse<T>> {
    return this.request<T>('GET', url, undefined, params);
  }

  public async post<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>('POST', url, data);
  }

  public async put<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', url, data);
  }

  public async patch<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', url, data);
  }

  public async delete<T>(url: string): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', url);
  }

  private async request<T>(
    method: string,
    endpoint: string,
    data?: unknown,
    params?: Record<string, string | number | boolean | undefined>
  ): Promise<ApiResponse<T>> {
    let url = `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, String(value));
      });
      const qs = searchParams.toString();
      if (qs) url += `?${qs}`;
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
      });

      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('dukanos:unauthorized'));
        }
      }

      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        throw new ApiError(
          errorJson.message || `Request failed with status ${response.status}`,
          response.status,
          errorJson.errors
        );
      }

      const json = await response.json();
      return json as ApiResponse<T>;
    } catch (err) {
      // Standalone Fallback for Demo
      // Do not use demo fallback for legitimate backend responses
      if (err instanceof ApiError) {
        throw err;
      }
      
      // Standalone Fallback for Demo (Network error / Backend unreachable)
      const fallback = this.getMockFallback<T>(endpoint, method, data);
      if (fallback) return fallback;
      throw err;
    }
  }

  private getMockFallback<T>(endpoint: string, method: string, data?: unknown): ApiResponse<T> | null {
    if (endpoint.includes('/auth/login') && method === 'POST') {
      const req = data as { email?: string };
      const email = (req?.email || 'owner@punjabelectric.pk').toLowerCase();

      let storedUser: { name?: string; status?: string; role?: { id: number; name: string; slug: string } } | undefined;
      try {
        const raw = typeof window !== 'undefined' ? localStorage.getItem('dukanos_users') : null;
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            storedUser = parsed.find(
              (u: { email?: string }) => u?.email?.toLowerCase() === email
            );
          }
        }
      } catch {
        // ignore
      }

      const roleSlug = (storedUser?.role?.slug as User['role']['slug']) ||
        (email.includes('admin')
          ? 'super_admin'
          : email.includes('manager')
          ? 'manager'
          : email.includes('cashier')
          ? 'cashier'
          : email.includes('accountant')
          ? 'accountant'
          : 'owner');

      const user: User = {
        id: storedUser?.role?.id || 1,
        name: storedUser?.name
          || (email.includes('admin')
            ? 'Super Admin'
            : email.includes('owner')
            ? 'Muhammad Akram Ch.'
            : 'Staff Member'),
        email: email,
        status: (storedUser?.status as User['status']) || 'active',
        role: {
          id: storedUser?.role?.id || 1,
          name: storedUser?.role?.name || roleSlug.replace('_', ' ').toUpperCase(),
          slug: roleSlug as User['role']['slug'],
        },
        tenant: {
          id: 1,
          name: 'Punjab Electric Store',
          slug: 'punjab-electric-store',
          city: 'Lahore',
          currency: 'PKR',
          timezone: 'Asia/Karachi',
          status: 'active',
        },
        permissions: ['*'],
      };

      return {
        success: true,
        message: 'Login successful (offline demo fallback)',
        data: { user, token: 'mock-jwt-token' } as unknown as T,
      };
    }

    if (endpoint.includes('/reports/summary')) {
      const summary: DashboardSummary = {
        today_sales: 68450,
        today_orders: 14,
        today_cash_collected: 45000,
        monthly_revenue: 820000,
        pending_receivables: 382400,
        low_stock_count: 3,
        sales_trend: [
          { date: '2026-08-27', amount: 54000 },
          { date: '2026-08-28', amount: 62000 },
          { date: '2026-08-29', amount: 48000 },
          { date: '2026-08-30', amount: 71000 },
          { date: '2026-08-31', amount: 83000 },
          { date: '2026-09-01', amount: 59000 },
          { date: '2026-09-02', amount: 68450 },
        ],
      };
      return { success: true, data: summary as unknown as T };
    }

    return null;
  }
}

export const apiClient = new ApiClient();
