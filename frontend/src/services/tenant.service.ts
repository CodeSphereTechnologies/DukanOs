import { apiClient } from './api-client';
import type { ApiResponse } from '../types/api.types';
import type { Tenant } from '../types/auth.types';

export const tenantService = {
  async getAll(): Promise<ApiResponse<Tenant[]>> {
    return apiClient.get<Tenant[]>('/super-admin/tenants');
  },
};
