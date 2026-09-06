import { apiClient } from './api-client';
import type { ApiResponse } from '../types/api.types';
import type { Product, Category, Brand, Specification } from '../types/product.types';

export const STORAGE_KEY_PRODUCTS = 'dukanos_products';

export const INITIAL_PRODUCTS: Product[] = [
  { id: 1, name: 'Royal Deluxe Ceiling Fan 56"', sku: 'ROY-FAN-56', barcode: '8901234567890', unit: 'pc', selling_price: 9500, purchase_cost: 7800, current_stock: 12, min_quantity_threshold: 10, status: 'active', category: { id: 1, name: 'Ceiling Fans', slug: 'ceiling-fans', status: 'active' }, brand: { id: 1, name: 'Royal Fans', slug: 'royal-fans', status: 'active' } },
  { id: 2, name: 'Pakistan Cables 7/29 Single Core Red 90m', sku: 'PAK-CAB-729R', barcode: '8901234567891', unit: 'coil', selling_price: 14500, purchase_cost: 12200, current_stock: 8, min_quantity_threshold: 15, status: 'active', category: { id: 2, name: 'Cables & Wires', slug: 'cables-wires', status: 'active' }, brand: { id: 2, name: 'Pakistan Cables', slug: 'pak-cables', status: 'active' } },
  { id: 3, name: 'Philips LED Bulb 18W Cool Daylight E27', sku: 'PHI-LED-18W', barcode: '8901234567892', unit: 'pc', selling_price: 650, purchase_cost: 480, current_stock: 45, min_quantity_threshold: 25, status: 'active', category: { id: 3, name: 'LED Bulbs', slug: 'led-bulbs', status: 'active' }, brand: { id: 3, name: 'Philips', slug: 'philips', status: 'active' } },
  { id: 4, name: 'Schneider MCB 32A Double Pole 6kA', sku: 'SCH-MCB-32DP', barcode: '8901234567893', unit: 'pc', selling_price: 2200, purchase_cost: 1650, current_stock: 24, min_quantity_threshold: 8, status: 'active', category: { id: 4, name: 'Circuit Breakers', slug: 'breakers', status: 'active' }, brand: { id: 4, name: 'Schneider', slug: 'schneider', status: 'active' } },
  { id: 5, name: 'Pak Fan Bracket Fan 18" Remote Control', sku: 'PAK-FAN-18B', barcode: '8901234567894', unit: 'pc', selling_price: 12800, purchase_cost: 10500, current_stock: 6, min_quantity_threshold: 5, status: 'active', category: { id: 1, name: 'Ceiling Fans', slug: 'ceiling-fans', status: 'active' }, brand: { id: 3, name: 'Pak Fan', slug: 'pak-fan', status: 'active' } },
];

function getStoredProducts(): Product[] {
  if (typeof window === 'undefined') return INITIAL_PRODUCTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PRODUCTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
      return INITIAL_PRODUCTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_PRODUCTS;
  } catch {
    return INITIAL_PRODUCTS;
  }
}

export const productService = {
  async getAll(): Promise<ApiResponse<Product[]>> {
    try {
      const res = await apiClient.get<Product[]>('/products');
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        return res;
      }
    } catch {
      // fallback
    }
    return {
      success: true,
      message: 'Products retrieved',
      data: getStoredProducts(),
    };
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

