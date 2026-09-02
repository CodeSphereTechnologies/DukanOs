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
