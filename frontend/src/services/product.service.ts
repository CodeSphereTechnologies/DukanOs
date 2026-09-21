import { apiClient } from './api-client';
import { ApiError, type ApiResponse } from '../types/api.types';
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

function toSlug(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
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
    image_url: asString(r.image) || undefined,
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
    const payload = {
      name: name.trim(),
      slug: toSlug(name),
      status: 'active' as const,
    };
    try {
      const res = await apiClient.post<Category>('/categories', payload);
      if (res && res.data) {
        saveStoredCategories(upsertStored(getStoredCategories(), res.data));
        return res.data;
      }
    } catch (err) {
      if (isApiError(err)) throw err;
      // offline fallback to local storage
    }
    const list = getStoredCategories();
    const existing = list.find((c) => c.name.toLowerCase() === payload.name.toLowerCase());
    if (existing) return existing;
    const newCat: Category = {
      id: list.length > 0 ? Math.max(...list.map((c) => c.id)) + 1 : 1,
      ...payload,
    };
    saveStoredCategories([...list, newCat]);
    return newCat;
  },

  async addBrand(name: string): Promise<Brand> {
    const payload = {
      name: name.trim(),
      slug: toSlug(name),
      status: 'active' as const,
    };
    try {
      const res = await apiClient.post<Brand>('/brands', payload);
      if (res && res.data) {
        saveStoredBrands(upsertStored(getStoredBrands(), res.data));
        return res.data;
      }
    } catch (err) {
      if (isApiError(err)) throw err;
      // offline fallback to local storage
    }
    const list = getStoredBrands();
    const existing = list.find((b) => b.name.toLowerCase() === payload.name.toLowerCase());
    if (existing) return existing;
    const newBrand: Brand = {
      id: list.length > 0 ? Math.max(...list.map((b) => b.id)) + 1 : 1,
      ...payload,
    };
    saveStoredBrands([...list, newBrand]);
    return newBrand;
  },

  async updateCategory(id: number, data: Partial<Pick<Category, 'name' | 'status'>>): Promise<Category | null> {
    const list = getStoredCategories();
    const current = list.find((c) => c.id === id);
    const name = (data.name ?? current?.name)?.trim();
    if (!name) return null;
    const payload = {
      name,
      slug: toSlug(name),
      status: data.status ?? current?.status ?? 'active',
    };
    try {
      const res = await apiClient.put<Category>(`/categories/${id}`, payload);
      if (res && res.data) {
        saveStoredCategories(upsertStored(getStoredCategories(), res.data));
        return res.data;
      }
    } catch (err) {
      if (isApiError(err)) throw err;
      // offline fallback to local storage
    }
    if (current) {
      const updated = { ...current, ...data };
      saveStoredCategories(upsertStored(list, updated));
      return updated;
    }
    return null;
  },

  async deleteCategory(id: number): Promise<boolean> {
    try {
      await apiClient.delete(`/categories/${id}`);
    } catch (err) {
      if (isApiError(err)) throw err;
      // offline fallback to local storage
    }
    const list = getStoredCategories();
    const next = list.filter((c) => c.id !== id);
    if (next.length === list.length) return false;
    saveStoredCategories(next);
    return true;
  },

  async updateBrand(id: number, data: Partial<Pick<Brand, 'name' | 'status'>>): Promise<Brand | null> {
    const list = getStoredBrands();
    const current = list.find((b) => b.id === id);
    const name = (data.name ?? current?.name)?.trim();
    if (!name) return null;
    const payload = {
      name,
      slug: toSlug(name),
      status: data.status ?? current?.status ?? 'active',
    };
    try {
      const res = await apiClient.put<Brand>(`/brands/${id}`, payload);
      if (res && res.data) {
        saveStoredBrands(upsertStored(getStoredBrands(), res.data));
        return res.data;
      }
    } catch (err) {
      if (isApiError(err)) throw err;
      // offline fallback to local storage
    }
    if (current) {
      const updated = { ...current, ...data };
      saveStoredBrands(upsertStored(list, updated));
      return updated;
    }
    return null;
  },

  async deleteBrand(id: number): Promise<boolean> {
    try {
      await apiClient.delete(`/brands/${id}`);
    } catch (err) {
      if (isApiError(err)) throw err;
      // offline fallback to local storage
    }
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

    const payload = buildProductPayload(data);

    try {
      const res = data.id
        ? await apiClient.put<Product>(`/products/${data.id}`, {
            ...payload,
            min_quantity_threshold: data.min_quantity_threshold ?? 0,
          })
        : await apiClient.post<Product>('/products', {
            ...payload,
            opening_quantity: data.current_stock || 0,
            min_quantity_threshold: data.min_quantity_threshold ?? 0,
          });
      if (res && res.data) {
        const backend = {
          ...mapProduct(res.data),
          ...(data.image_url !== undefined ? { image_url: data.image_url } : {}),
          ...(data.gallery !== undefined ? { gallery: data.gallery } : {}),
        };
        saveStoredProducts(upsertStored(list, backend));
        return backend;
      }
    } catch (err) {
      if (isApiError(err)) throw err;
      // offline fallback to local storage
    }

    saveStoredProducts(upsertStored(list, newProd));
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
    try {
      const res = await apiClient.get<unknown>(`/products/${id}`);
      if (res && res.data) {
        const backend = mapProduct(res.data);
        saveStoredProducts(upsertStored(getStoredProducts(), backend));
        return backend;
      }
    } catch {
      // offline fallback to local storage
    }
    const list = getStoredProducts();
    return list.find((p) => p.id === id) || null;
  },

  async deleteProduct(id: number): Promise<boolean> {
    try {
      await apiClient.delete(`/products/${id}`);
    } catch (err) {
      if (isApiError(err)) throw err;
      // offline fallback to local storage
    }
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
    const current = await this.getById(id);
    if (!current) return null;
    return this.saveProduct({ ...current, status });
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

function upsertStored<T extends { id: number }>(list: T[], item: T): T[] {
  const filtered = list.filter((entry) => entry.id !== item.id);
  return [item, ...filtered];
}

function buildProductPayload(data: Omit<Product, 'id'> & { id?: number }): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    name: data.name,
    sku: data.sku,
    barcode: data.barcode || null,
    description: data.description || null,
    category_id: data.category?.id ?? data.category_id ?? null,
    brand_id: data.brand?.id ?? data.brand_id ?? null,
    image: data.image_url || data.gallery?.[0] || null,
    unit: data.unit || 'pc',
    purchase_cost: data.purchase_cost ?? 0,
    selling_price: data.selling_price,
    status: data.status || 'active',
  };
  if (data.model_number !== undefined) payload.model_number = data.model_number;
  if (data.min_selling_price !== undefined) payload.min_selling_price = data.min_selling_price;
  return payload;
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

