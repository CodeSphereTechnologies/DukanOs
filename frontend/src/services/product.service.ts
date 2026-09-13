import { apiClient } from './api-client';
import type { ApiResponse } from '../types/api.types';
import type { Product, Category, Brand, Specification } from '../types/product.types';

export const STORAGE_KEY_PRODUCTS = 'dukanos_products';
export const STORAGE_KEY_CATEGORIES = 'dukanos_categories';
export const STORAGE_KEY_BRANDS = 'dukanos_brands';

export const INITIAL_CATEGORIES: Category[] = [
  { id: 1, name: 'Ceiling Fans', slug: 'ceiling-fans', status: 'active' },
  { id: 2, name: 'Bracket Fans', slug: 'bracket-fans', status: 'active' },
  { id: 3, name: 'Pedestal Fans', slug: 'pedestal-fans', status: 'active' },
  { id: 4, name: 'Exhaust Fans', slug: 'exhaust-fans', status: 'active' },
  { id: 5, name: 'Air Conditioners', slug: 'air-conditioners', status: 'active' },
  { id: 6, name: 'Cables & Wires', slug: 'cables-wires', status: 'active' },
  { id: 7, name: 'LED Bulbs', slug: 'led-bulbs', status: 'active' },
  { id: 8, name: 'Tube Lights', slug: 'tube-lights', status: 'active' },
  { id: 9, name: 'Light Fittings', slug: 'light-fittings', status: 'active' },
  { id: 10, name: 'Switches & Sockets', slug: 'switches-sockets', status: 'active' },
  { id: 11, name: 'Circuit Breakers', slug: 'circuit-breakers', status: 'active' },
  { id: 12, name: 'Distribution Boards', slug: 'distribution-boards', status: 'active' },
  { id: 13, name: 'Energy Meters', slug: 'energy-meters', status: 'active' },
  { id: 14, name: 'Motors & Pumps', slug: 'motors-pumps', status: 'active' },
  { id: 15, name: 'Water Heaters / Geysers', slug: 'water-heaters-geysers', status: 'active' },
  { id: 16, name: 'Generators', slug: 'generators', status: 'active' },
  { id: 17, name: 'Solar Equipment', slug: 'solar-equipment', status: 'active' },
  { id: 18, name: 'Wiring Accessories', slug: 'wiring-accessories', status: 'active' },
  { id: 19, name: 'General Appliances', slug: 'general-appliances', status: 'active' },
];

export const INITIAL_BRANDS: Brand[] = [
  { id: 1, name: 'Royal Fans', slug: 'royal-fans', status: 'active' },
  { id: 2, name: 'Pak Fan', slug: 'pak-fan', status: 'active' },
  { id: 3, name: 'Orient', slug: 'orient', status: 'active' },
  { id: 4, name: 'GFC', slug: 'gfc', status: 'active' },
  { id: 5, name: 'Waves', slug: 'waves', status: 'active' },
  { id: 6, name: 'Pakistan Cables', slug: 'pakistan-cables', status: 'active' },
  { id: 7, name: 'Philips', slug: 'philips', status: 'active' },
  { id: 8, name: 'Osaka', slug: 'osaka', status: 'active' },
  { id: 9, name: 'Schneider', slug: 'schneider', status: 'active' },
  { id: 10, name: 'Havelis', slug: 'havelis', status: 'active' },
  { id: 11, name: 'Legrand', slug: 'legrand', status: 'active' },
  { id: 12, name: 'Siemens', slug: 'siemens', status: 'active' },
  { id: 13, name: 'Dawlance', slug: 'dawlance', status: 'active' },
  { id: 14, name: 'Haier', slug: 'haier', status: 'active' },
  { id: 15, name: 'Pel', slug: 'pel', status: 'active' },
  { id: 16, name: 'Super Asia', slug: 'super-asia', status: 'active' },
  { id: 17, name: 'Atomberg', slug: 'atomberg', status: 'active' },
  { id: 18, name: 'Crompton', slug: 'crompton', status: 'active' },
  { id: 19, name: 'BC', slug: 'bc', status: 'active' },
  { id: 20, name: 'Master', slug: 'master', status: 'active' },
  { id: 21, name: 'Symphony', slug: 'symphony', status: 'active' },
  { id: 22, name: 'Generic', slug: 'generic', status: 'active' },
];

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

function getStoredCategories(): Category[] {
  if (typeof window === 'undefined') return INITIAL_CATEGORIES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CATEGORIES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
      return INITIAL_CATEGORIES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_CATEGORIES;
  } catch {
    return INITIAL_CATEGORIES;
  }
}

function getStoredBrands(): Brand[] {
  if (typeof window === 'undefined') return INITIAL_BRANDS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BRANDS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_BRANDS, JSON.stringify(INITIAL_BRANDS));
      return INITIAL_BRANDS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_BRANDS;
  } catch {
    return INITIAL_BRANDS;
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
    try {
      const res = await apiClient.get<Category[]>('/categories');
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        return res;
      }
    } catch {
      // fallback
    }
    return {
      success: true,
      message: 'Categories retrieved',
      data: getStoredCategories(),
    };
  },

  async getBrands(): Promise<ApiResponse<Brand[]>> {
    try {
      const res = await apiClient.get<Brand[]>('/brands');
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        return res;
      }
    } catch {
      // fallback
    }
    return {
      success: true,
      message: 'Brands retrieved',
      data: getStoredBrands(),
    };
  },

  async addCategory(name: string): Promise<Category> {
    const list = getStoredCategories();
    const existing = list.find((c) => c.name.toLowerCase() === name.trim().toLowerCase());
    if (existing) return existing;
    const newCat: Category = {
      id: list.length > 0 ? Math.max(...list.map((c) => c.id)) + 1 : 1,
      name: name.trim(),
      slug: name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      status: 'active',
    };
    const updated = [...list, newCat];
    saveStoredCategories(updated);
    return newCat;
  },

  async addBrand(name: string): Promise<Brand> {
    const list = getStoredBrands();
    const existing = list.find((b) => b.name.toLowerCase() === name.trim().toLowerCase());
    if (existing) return existing;
    const newBrand: Brand = {
      id: list.length > 0 ? Math.max(...list.map((b) => b.id)) + 1 : 1,
      name: name.trim(),
      slug: name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      status: 'active',
    };
    const updated = [...list, newBrand];
    saveStoredBrands(updated);
    return newBrand;
  },

  async updateCategory(id: number, data: Partial<Pick<Category, 'name' | 'status'>>): Promise<Category | null> {
    const list = getStoredCategories();
    const idx = list.findIndex((c) => c.id === id);
    if (idx < 0) return null;
    list[idx] = {
      ...list[idx],
      ...data,
      ...(data.name !== undefined
        ? { slug: data.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') }
        : {}),
    };
    saveStoredCategories(list);
    return list[idx];
  },

  async deleteCategory(id: number): Promise<boolean> {
    const list = getStoredCategories();
    const next = list.filter((c) => c.id !== id);
    if (next.length === list.length) return false;
    saveStoredCategories(next);
    return true;
  },

  async updateBrand(id: number, data: Partial<Pick<Brand, 'name' | 'status'>>): Promise<Brand | null> {
    const list = getStoredBrands();
    const idx = list.findIndex((b) => b.id === id);
    if (idx < 0) return null;
    list[idx] = {
      ...list[idx],
      ...data,
      ...(data.name !== undefined
        ? { slug: data.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') }
        : {}),
    };
    saveStoredBrands(list);
    return list[idx];
  },

  async deleteBrand(id: number): Promise<boolean> {
    const list = getStoredBrands();
    const next = list.filter((b) => b.id !== id);
    if (next.length === list.length) return false;
    saveStoredBrands(next);
    return true;
  },

  async saveProduct(
    data: Omit<Product, 'id'> & { id?: number }
  ): Promise<Product> {
    const list = getStoredProducts();
    const newProd: Product = {
      ...data,
      id: data.id || (list.length > 0 ? Math.max(...list.map((p) => p.id)) + 1 : 1),
    };
    const updated = [newProd, ...list.filter((p) => p.id !== newProd.id)];
    saveStoredProducts(updated);
    return newProd;
  },

  async getSpecifications(): Promise<ApiResponse<Specification[]>> {
    return apiClient.get<Specification[]>('/specifications');
  },

  async updateStock(productId: number, decrementBy: number): Promise<Product | null> {
    const list = getStoredProducts();
    const idx = list.findIndex((p) => p.id === productId);
    if (idx < 0) return null;
    list[idx] = {
      ...list[idx],
      current_stock: Math.max(0, (list[idx].current_stock || 0) - decrementBy),
    };
    saveStoredProducts(list);
    return list[idx];
  },

  async getById(id: number): Promise<Product | null> {
    const list = getStoredProducts();
    return list.find((p) => p.id === id) || null;
  },

  async deleteProduct(id: number): Promise<boolean> {
    const list = getStoredProducts();
    const next = list.filter((p) => p.id !== id);
    if (next.length === list.length) return false;
    saveStoredProducts(next);
    return true;
  },

  async updateStatus(
    id: number,
    status: Product['status']
  ): Promise<Product | null> {
    const list = getStoredProducts();
    const idx = list.findIndex((p) => p.id === id);
    if (idx < 0) return null;
    list[idx] = { ...list[idx], status };
    saveStoredProducts(list);
    return list[idx];
  },
};

function saveStoredProducts(products: Product[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products));
  } catch {
    // ignore
  }
}

function saveStoredCategories(categories: Category[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(categories));
  } catch {
    // ignore
  }
}

function saveStoredBrands(brands: Brand[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_BRANDS, JSON.stringify(brands));
  } catch {
    // ignore
  }
}

