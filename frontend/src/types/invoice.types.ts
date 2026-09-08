import type { Customer } from './customer.types';
import type { Product } from './product.types';

export interface InvoiceItem {
  id: number;
  invoice_id?: number;
  product_id: number;
  product_name: string;
  sku: string;
  unit_price: number;
  quantity: number;
  discount_amount: number;
  total_price: number;
  product?: Product;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  customer_id?: number;
  customer?: Customer;
  invoice_date: string;
  status: 'draft' | 'issued' | 'paid' | 'cancelled';
  payment_status: 'paid' | 'partial' | 'unpaid' | 'ledger';
  subtotal: number;
  discount_amount: number;
  tax_amount?: number;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  payment_method: 'cash' | 'bank_transfer' | 'card' | 'other' | 'ledger';
  notes?: string;
  items: InvoiceItem[];
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
  discount_amount: number;
  total_amount: number;
  notes?: string;
  items: InvoiceItem[];
  created_at: string;
}
