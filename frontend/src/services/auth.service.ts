import { apiClient } from './api-client';
import type { ApiResponse } from '../types/api.types';
import type { LoginCredentials, LoginResponseData, User } from '../types/auth.types';

export const authService = {
  async login(credentials: LoginCredentials): Promise<ApiResponse<LoginResponseData>> {
    return apiClient.post<LoginResponseData>('/auth/login', credentials);
  },

  async logout(): Promise<ApiResponse<void>> {
    return apiClient.post<void>('/auth/logout');
  },

  async getMe(): Promise<ApiResponse<User>> {
    return apiClient.get<User>('/auth/me');
  },
};
