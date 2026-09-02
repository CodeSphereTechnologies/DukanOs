export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parent_id?: number | null;
  status: 'active' | 'inactive';
  children?: Category[];
}

export interface Brand {
  id: number;
  name: string;
  slug: string;
  status: 'active' | 'inactive';
}

export interface Specification {
  id: number;
  name: string;
  slug: string;
  data_type: 'text' | 'number' | 'select' | 'boolean';
  unit?: string;
  is_required: boolean;
  is_filterable: boolean;
  sort_order: number;
  status: 'active' | 'inactive';
  values?: string[];
}

export interface Product {
  id: number;
  tenant_id?: number;
  category_id?: number;
  brand_id?: number;
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  unit: string;
  purchase_cost?: number;
  selling_price: number;
  current_stock: number;
  min_quantity_threshold?: number;
  status: 'active' | 'inactive' | 'archived';
  category?: Category;
  brand?: Brand;
  specifications?: Record<string, string | number>;
  image_url?: string;
}

export interface InventoryItem {
  id: number;
  product_id: number;
  product?: Product;
  quantity: number;
  location?: string;
}

export interface InventoryTransaction {
  id: number;
  product_id: number;
  product_name?: string;
  type: 'in' | 'out' | 'adjustment' | 'return';
  quantity: number;
  previous_stock: number;
  new_stock: number;
  notes?: string;
  created_at: string;
}
