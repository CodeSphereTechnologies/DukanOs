export const APP_CONFIG = {
  name: 'DukanOS',
  apiBaseUrl: import.meta.env.VITE_API_URL || '/api/v1',
  tokenKey: 'dukanos_auth_token',
  userKey: 'dukanos_auth_user',
};

export const SEEDED_ACCOUNTS = [
  { role: 'Super Admin', email: 'admin@dukanos.com', password: 'password', desc: 'Platform control & multi-tenancy' },
  { role: 'Store Owner', email: 'owner@punjabelectric.pk', password: 'password', desc: 'Full store executive control' },
  { role: 'Store Manager', email: 'manager@punjabelectric.pk', password: 'password', desc: 'Inventory & operations' },
  { role: 'Cashier', email: 'cashier@punjabelectric.pk', password: 'password', desc: 'High-speed POS sales' },
  { role: 'Accountant', email: 'accountant@punjabelectric.pk', password: 'password', desc: 'Financial ledgers & reports' },
];

export const ROLE_DASHBOARDS: Record<string, string> = {
  super_admin: '/super-admin/dashboard',
  owner: '/dashboard',
  manager: '/manager/dashboard',
  cashier: '/cashier/dashboard',
  accountant: '/accountant/dashboard',
};
