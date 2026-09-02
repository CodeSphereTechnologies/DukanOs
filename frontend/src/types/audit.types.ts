export interface AuditLog {
  id: number;
  user_id?: number;
  user_name?: string;
  module: string;
  action: string;
  entity_type: string;
  entity_id?: number | string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  ip_address: string;
  device?: string;
  created_at: string;
}
