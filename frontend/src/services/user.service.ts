import { apiClient } from './api-client';
import type { ApiResponse } from '../types/api.types';
import type { StoreUser } from '../types/user.types';

export const userService = {
  async getAll(): Promise<ApiResponse<StoreUser[]>> {
    return apiClient.get<StoreUser[]>('/users');
  },
};
