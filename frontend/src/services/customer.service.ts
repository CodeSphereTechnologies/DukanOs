import { apiClient } from './api-client';
import type { ApiResponse } from '../types/api.types';
import type { Customer, CustomerLedgerEntry } from '../types/customer.types';

export const customerService = {
  async getAll(): Promise<ApiResponse<Customer[]>> {
    return apiClient.get<Customer[]>('/customers');
  },
  async getLedger(customerId: number): Promise<ApiResponse<CustomerLedgerEntry[]>> {
    return apiClient.get<CustomerLedgerEntry[]>(`/customers/${customerId}/ledger`);
  },
};
