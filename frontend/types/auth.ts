export interface User {
  id: string | number;
  email?: string;
  full_name?: string;
  is_active?: boolean;
  is_superuser?: boolean;
  // Bổ sung thêm các trường tùy thuộc vào model User ở backend của bạn
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}