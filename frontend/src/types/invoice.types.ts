import type { Customer } from './customer.types';
import type { Product } from './product.types';

export interface InvoiceItem {
  id: number;
  invoice_id?: number;
  product_id: number;
  product_name?: string;
  sku: string;
  unit_price: number;
  quantity: number;
  discount_amount: number;
  total_price: number;
  product?: Product;
}

export interface SaleReturnItem {
  id: number;
  return_id: number;
  invoice_item_id?: number;
  product_id: number;
  product_name?: string;
  quantity: number;
  unit_price: number;
  amount: number;
  product?: Product;
}

export interface SaleReturn {
  id: number;
  return_number: string;
  invoice_id: number;
  customer_id?: number;
  customer?: Customer;
  return_date: string;
  reason?: string;
  refund_type: 'cash' | 'credit' | 'bank_transfer' | 'exchange';
  total_amount: number;
  status: 'pending' | 'approved' | 'processed' | 'rejected' | 'completed';
  items?: SaleReturnItem[];
  created_at: string;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  customer_id?: number;
  customer?: Customer;
  invoice_date: string;
  status: 'draft' | 'issued' | 'paid' | 'cancelled' | 'voided';
  payment_status: 'paid' | 'partial' | 'unpaid' | 'ledger';
  subtotal: number;
  discount_type?: 'fixed' | 'percentage' | null;
  discount_value?: number;
  discount_amount: number;
  tax_amount?: number;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  payment_method: 'cash' | 'bank_transfer' | 'card' | 'online' | 'other' | 'ledger';
  notes?: string;
  items: InvoiceItem[];
  returns?: SaleReturn[];
  created_at: string;
}

export interface Quotation {
  id: number;
  quotation_number: string;
  customer_id?: number;
  customer?: Customer;
  quotation_date: string;
  valid_until: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'converted';
  subtotal: number;
  discount_type?: 'fixed' | 'percentage' | null;
  discount_value?: number;
  discount_amount: number;
  total_amount: number;
  notes?: string;
  items: InvoiceItem[];
  created_at: string;
}
