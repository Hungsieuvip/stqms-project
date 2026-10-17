import { apiClient } from '../lib/apiClient';
import { User, UserListResponse, RoleInfo } from '../types/user';

export const userService = {
  // Lấy danh sách người dùng (Hỗ trợ phân trang, tìm kiếm, lọc theo role)
  getUsers: async (params?: any): Promise<UserListResponse> => {
    const response = await apiClient.get('/users', { params });
    return response.data;
  },

  // Lấy danh sách các vai trò hệ thống
  getRoles: async (): Promise<RoleInfo[]> => {
    const response = await apiClient.get('/users/roles/list');
    return response.data;
  },

  // Tạo tài khoản mới
  createUser: async (data: any) => {
    const response = await apiClient.post('/users', data);
    return response.data;
  },

  // Cập nhật thông tin & phân quyền Role
  updateUser: async (id: string | number, data: any) => {
    const response = await apiClient.put(`/users/${id}`, data);
    return response.data;
  },

  // Xóa tài khoản
  deleteUser: async (id: string | number) => {
    const response = await apiClient.delete(`/users/${id}`);
    return response.data;
  },
};
