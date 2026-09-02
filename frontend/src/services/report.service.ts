import { apiClient } from './api-client';
import type { ApiResponse } from '../types/api.types';
import type { DashboardSummary, SuperAdminMetrics } from '../types/report.types';

export const reportService = {
  async getSummary(): Promise<ApiResponse<DashboardSummary>> {
    return apiClient.get<DashboardSummary>('/reports/summary');
  },
  async getSuperAdminMetrics(): Promise<ApiResponse<SuperAdminMetrics>> {
    return apiClient.get<SuperAdminMetrics>('/super-admin/metrics');
  },
};
