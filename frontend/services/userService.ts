import { apiClient } from '../lib/apiClient';
import { User, UserListResponse } from '../types/user';

export const userService = {
  // Lấy danh sách người dùng (Hỗ trợ phân trang, tìm kiếm, lọc theo role)
  getUsers: async (params: any): Promise<UserListResponse> => {
    const response = await apiClient.get('/users', { params });
    return response.data;
  },

  // Tạo tài khoản mới
  createUser: async (data: Partial<User>) => {
    const response = await apiClient.post('/users', data);
    return response.data;
  },

  // Cập nhật thông tin & phân quyền Role
  updateUser: async (id: string, data: Partial<User>) => {
    const response = await apiClient.put(`/users/${id}`, data);
    return response.data;
  },

  // Xóa tài khoản
  deleteUser: async (id: string) => {
    const response = await apiClient.delete(`/users/${id}`);
    return response.data;
  },
};