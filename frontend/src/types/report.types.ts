export interface DashboardSummary {
  today_sales: number;
  today_orders: number;
  today_cash_collected: number;
  monthly_revenue: number;
  pending_receivables: number;
  low_stock_count: number;
  sales_trend: { date: string; amount: number }[];
}

export interface SuperAdminMetrics {
  total_tenants: number;
  active_tenants: number;
  total_revenue: number;
  total_users: number;
  system_health: 'healthy' | 'degraded';
}

export interface FinancialSummary {
  income: number;
  expense: number;
  net: number;
  payments: number;
  outstanding: number;
}

export interface CustomerBalance {
  customer_id: number;
  name: string;
  phone: string;
  balance: number;
}

export interface LedgerCategory {
  id: number;
  type: 'income' | 'expense';
  name: string;
  description: string | null;
  is_system: boolean;
  status: string;
}

export interface DailyTransaction {
  id: number;
  type: 'income' | 'expense';
  amount: number;
  transaction_date: string;
  description: string | null;
  category: LedgerCategory | null;
  created_by: string | null;
}
