export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'manager' | 'staff' | 'viewer';
  is_active: boolean;
  created_at: string;
}

export interface UserListResponse {
  items: User[];
  total: number;
  page: number;
  size: number;
}