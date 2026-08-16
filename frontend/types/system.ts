export interface AuditLog {
  id: string;
  user_name: string;
  action: string;
  module: string;
  timestamp: string;
  ip_address: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}