export interface AuditLog {
  id: number;
  user_id?: number;
  user?: string;
  module: string;
  action: string;
  entity_type?: string;
  entity_id?: number | string;
  old_values?: Record<string, unknown> | null;
  new_values?: Record<string, unknown> | null;
  ip_address?: string;
  device?: string;
  created_at: string;
}
