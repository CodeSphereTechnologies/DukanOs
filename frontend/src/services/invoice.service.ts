import { apiClient } from './api-client';
import type { ApiResponse } from '../types/api.types';
import type { Invoice, Quotation } from '../types/invoice.types';

export const invoiceService = {
  async getAll(): Promise<ApiResponse<Invoice[]>> {
    return apiClient.get<Invoice[]>('/invoices');
  },
  async getQuotations(): Promise<ApiResponse<Quotation[]>> {
    return apiClient.get<Quotation[]>('/quotations');
  },
};
