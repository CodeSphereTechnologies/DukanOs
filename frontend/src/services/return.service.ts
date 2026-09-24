import { apiClient } from './api-client';
import type { ApiResponse } from '../types/api.types';
import type { SaleReturn } from '../types/invoice.types';

export const returnService = {
  async getAll(): Promise<ApiResponse<SaleReturn[]>> {
    try {
      const res = await apiClient.get<SaleReturn[]>('/returns');
      if (res && res.data) {
        return {
          success: true,
          message: 'Returns retrieved successfully',
          data: Array.isArray(res.data) ? res.data : ((res.data as any).data || []),
        };
      }
    } catch {
      // Return empty list if API fails
    }
    return { success: true, message: 'Returns retrieved', data: [] };
  },

  async getById(id: string | number): Promise<ApiResponse<SaleReturn>> {
    const res = await apiClient.get<SaleReturn>(`/returns/${id}`);
    return res;
  },

  async create(data: {
    invoice_id: number;
    return_date?: string;
    reason?: string;
    refund_type: string;
    notes?: string;
    items: {
      invoice_item_id: number;
      quantity: number;
      reason?: string;
    }[];
  }): Promise<ApiResponse<SaleReturn>> {
    const res = await apiClient.post<SaleReturn>('/returns', data);
    return res;
  }
};
