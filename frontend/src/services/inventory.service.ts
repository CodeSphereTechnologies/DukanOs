import { apiClient } from './api-client';
import { productService } from './product.service';

export interface ReorderQueueItem {
  id: number;
  name: string;
  sku: string;
  current_stock: number;
  threshold: number;
}

interface InventoryReportPayload {
  total_products?: number;
  total_stock_units?: number;
  low_stock_count?: number;
  verified_products?: number;
  reconciled_products?: number;
  stock_accuracy?: number;
  low_stock?: Array<{
    product_id: number;
    name: string | null;
    sku: string | null;
    quantity: number;
    threshold: number;
  }>;
}

export interface StockAccuracySummary {
  accuracy: number;
  verified_products: number;
  reconciled_products: number;
  total_products: number;
  total_stock_units: number;
}

export const inventoryService = {
  async getStockAccuracy(): Promise<StockAccuracySummary | null> {
    try {
      const res = await apiClient.get<InventoryReportPayload>('/reports/inventory');
      const data = res?.data;
      if (!data) return null;
      return {
        accuracy: Number(data.stock_accuracy) || 0,
        verified_products: Number(data.verified_products) || 0,
        reconciled_products: Number(data.reconciled_products) || 0,
        total_products: Number(data.total_products) || 0,
        total_stock_units: Number(data.total_stock_units) || 0,
      };
    } catch {
      return null;
    }
  },

  async getReorderQueue(): Promise<ReorderQueueItem[]> {
    try {
      const res = await apiClient.get<InventoryReportPayload>('/reports/inventory');
      const items = res?.data?.low_stock;
      if (Array.isArray(items)) {
        return items
          .filter((i) => i && i.product_id)
          .map((i) => ({
            id: Number(i.product_id),
            name: i.name || 'Unknown product',
            sku: i.sku || '—',
            current_stock: i.quantity,
            threshold: i.threshold,
          }));
      }
    } catch {
      // fallback to product-level low-stock computation
    }
    return buildQueueFromProducts();
  },

  async adjustStock(productId: number, delta: number, note?: string): Promise<boolean> {
    if (delta === 0) return true;
    try {
      await apiClient.post<null>(`/inventory/${productId}/adjust`, { delta, note: note || 'Manager dashboard adjustment' });
      return true;
    } catch {
      const product = await productService.getById(productId);
      if (!product) return false;
      await productService.saveProduct({
        ...product,
        current_stock: Math.max(0, (product.current_stock || 0) + delta),
      });
      return true;
    }
  },
};

async function buildQueueFromProducts(): Promise<ReorderQueueItem[]> {
  const res = await productService.getAll();
  return (res.data || [])
    .filter((p) => (p.current_stock || 0) <= (p.min_quantity_threshold ?? 5))
    .sort((a, b) => (a.current_stock || 0) - (b.current_stock || 0))
    .map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      current_stock: p.current_stock || 0,
      threshold: p.min_quantity_threshold ?? 5,
    }));
}