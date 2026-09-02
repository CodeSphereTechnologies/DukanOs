export interface Customer {
  id: number;
  tenant_id?: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  current_balance: number;
  status: 'active' | 'inactive';
  created_at?: string;
}

export interface CustomerLedgerEntry {
  id: number;
  customer_id: number;
  invoice_id?: number;
  transaction_type: 'debit' | 'credit';
  amount: number;
  running_balance: number;
  description: string;
  date: string;
}
