import { apiClient } from '../lib/apiClient';

// 👉 Thêm chữ "export" ở đây
export const systemService = {
  // Audit Logs
  getLogs: async (params: any) => {
    const response = await apiClient.get('/system/logs', { params });
    return response.data;
  },
  
  // Notifications
  getNotifications: async () => {
    const response = await apiClient.get('/system/notifications');
    return response.data;
  },
  markAsRead: async (id: string) => {
    return await apiClient.patch(`/system/notifications/${id}/read`);
  }
};