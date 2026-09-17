import { apiClient } from './api-client';
import type { ApiResponse } from '../types/api.types';
import type { Product, Category, Brand, Specification } from '../types/product.types';

export const STORAGE_KEY_PRODUCTS = 'dukanos_products_v4';
export const STORAGE_KEY_CATEGORIES = 'dukanos_categories_v4';
export const STORAGE_KEY_BRANDS = 'dukanos_brands_v4';

export const INITIAL_CATEGORIES: Category[] = [];

export const INITIAL_BRANDS: Brand[] = [];

export const INITIAL_PRODUCTS: Product[] = [];

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function asNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

// Backend list endpoints return either a plain array or a paginated { data: [...] } wrapper.
function unwrapList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  const rec = asRecord(payload);
  if (Array.isArray(rec.data)) return rec.data as T[];
  return [];
}

function mapProduct(raw: unknown): Product {
  const r = asRecord(raw);
  const inventory = asRecord(r.inventory);
  return {
    id: asNumber(r.id),
    name: asString(r.name, ''),
    sku: asString(r.sku),
    barcode: asString(r.barcode) || undefined,
    description: asString(r.description) || undefined,
    unit: asString(r.unit, 'pcs'),
    purchase_cost: asNumber(r.purchase_cost),
    selling_price: asNumber(r.selling_price),
    current_stock: asNumber(inventory.quantity ?? r.current_stock),
    min_quantity_threshold: asNumber(inventory.min_quantity_threshold ?? r.min_quantity_threshold) || undefined,
    status: (asString(r.status, 'active') as Product['status']) || 'active',
    category: r.category ? (r.category as Product['category']) : undefined,
    brand: r.brand ? (r.brand as Product['brand']) : undefined,
    specifications: r.specifications ? (r.specifications as Product['specifications']) : undefined,
  };
}

function getStoredProducts(): Product[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PRODUCTS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getStoredCategories(): Category[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CATEGORIES);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getStoredBrands(): Brand[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BRANDS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export const productService = {
  async getAll(): Promise<ApiResponse<Product[]>> {
    try {
      const res = await apiClient.get<unknown>('/products');
      const list = unwrapList<unknown>(res?.data).map(mapProduct);
      if (list.length > 0) {
        saveStoredProducts(list);
        return {
          success: true,
          message: res?.message || 'Products retrieved',
          data: list,
        };
      }
    } catch {
      // offline fallback
    }
    return {
      success: true,
      message: 'Products retrieved',
      data: getStoredProducts(),
    };
  },
  async getCategories(): Promise<ApiResponse<Category[]>> {
    try {
      const res = await apiClient.get<unknown>('/categories');
      const list = unwrapList<unknown>(res?.data) as Category[];
      if (list.length > 0) {
        saveStoredCategories(list);
        return {
          success: true,
          message: res?.message || 'Categories retrieved',
          data: list,
        };
      }
    } catch {
      // offline fallback
    }
    return {
      success: true,
      message: 'Categories retrieved',
      data: getStoredCategories(),
    };
  },

  async getBrands(): Promise<ApiResponse<Brand[]>> {
    try {
      const res = await apiClient.get<unknown>('/brands');
      const list = unwrapList<unknown>(res?.data) as Brand[];
      if (list.length > 0) {
        saveStoredBrands(list);
        return {
          success: true,
          message: res?.message || 'Brands retrieved',
          data: list,
        };
      }
    } catch {
      // offline fallback
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

