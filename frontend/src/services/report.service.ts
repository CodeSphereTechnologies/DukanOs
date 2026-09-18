import { apiClient } from './api-client';
import type { ApiResponse, PaginatedData } from '../types/api.types';
import type {
  DashboardSummary,
  SuperAdminMetrics,
  FinancialSummary,
  CustomerBalance,
  DailyTransaction,
  LedgerCategory,
} from '../types/report.types';

export const reportService = {
  async getSummary(): Promise<ApiResponse<DashboardSummary>> {
    return apiClient.get<DashboardSummary>('/reports/summary');
  },
  async getSuperAdminMetrics(): Promise<ApiResponse<SuperAdminMetrics>> {
    return apiClient.get<SuperAdminMetrics>('/super-admin/metrics');
  },
  async getFinancial(from?: string, to?: string): Promise<ApiResponse<FinancialSummary>> {
    return apiClient.get<FinancialSummary>('/reports/financial', { from, to });
  },
  async getCustomerBalances(): Promise<ApiResponse<CustomerBalance[]>> {
    return apiClient.get<CustomerBalance[]>('/reports/customer-balances');
  },
  async getDailyTransactions(params?: {
    from?: string;
    to?: string;
    per_page?: number;
  }): Promise<ApiResponse<PaginatedData<DailyTransaction>>> {
    return apiClient.get<PaginatedData<DailyTransaction>>('/daily-transactions', params);
  },
  async getLedgerCategories(): Promise<ApiResponse<LedgerCategory[]>> {
    return apiClient.get<LedgerCategory[]>('/ledger-categories');
  },
  async postDailyTransaction(data: {
    type: 'income' | 'expense';
    category_id?: number;
    amount: number;
    transaction_date: string;
    description?: string;
  }): Promise<ApiResponse<DailyTransaction>> {
    return apiClient.post<DailyTransaction>('/daily-transactions', data);
  },
};