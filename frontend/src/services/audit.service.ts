import { apiClient } from './api-client';
import type { ApiResponse } from '../types/api.types';
import type { AuditLog } from '../types/audit.types';

export const auditService = {
  async getAll(): Promise<ApiResponse<AuditLog[]>> {
    return apiClient.get<AuditLog[]>('/audit-logs');
  },
};
