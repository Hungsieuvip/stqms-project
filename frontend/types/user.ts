export interface User {
  id: string | number;
  username?: string;
  email: string;
  full_name?: string | null;
  phone?: string | null;
  role: string;
  roles?: string[];
  department_id?: string | null;
  department_name?: string | null;
  is_active: boolean;
  created_at?: string;
}

export interface UserListResponse {
  items: User[];
  total: number;
  page: number;
  size: number;
}

export interface RoleInfo {
  id: number;
  name: string;
  description?: string;
  permission_count?: number;
}
