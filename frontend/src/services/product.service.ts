import { apiClient } from './api-client';
import type { ApiResponse } from '../types/api.types';
import type { Product, Category, Brand, Specification } from '../types/product.types';

export const productService = {
  async getAll(): Promise<ApiResponse<Product[]>> {
    return apiClient.get<Product[]>('/products');
  },
  async getCategories(): Promise<ApiResponse<Category[]>> {
    return apiClient.get<Category[]>('/categories');
  },
  async getBrands(): Promise<ApiResponse<Brand[]>> {
    return apiClient.get<Brand[]>('/brands');
  },
  async getSpecifications(): Promise<ApiResponse<Specification[]>> {
    return apiClient.get<Specification[]>('/specifications');
  },
};
