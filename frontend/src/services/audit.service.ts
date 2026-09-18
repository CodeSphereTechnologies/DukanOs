import { apiClient } from './api-client';
import type { ApiResponse, PaginatedData } from '../types/api.types';
import type { AuditLog } from '../types/audit.types';

export const auditService = {
  async getAll(params?: {
    module?: string;
    action?: string;
    per_page?: number;
  }): Promise<ApiResponse<PaginatedData<AuditLog>>> {
    return apiClient.get<PaginatedData<AuditLog>>('/audit-logs', params);
  },
};