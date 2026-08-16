import { apiClient } from '../lib/apiClient';
import { Task, Plan, TaskListResponse } from '../types/task';
import { AxiosRequestConfig } from 'axios';

export const taskService = {
  // Lấy danh sách kế hoạch (Để làm bộ lọc và dropdown)
  getPlans: async (): Promise<Plan[]> => {
    const response = await apiClient.get('/plans');
    return response.data;
  },

  // Lấy danh sách nhiệm vụ (Kèm search, filter)
  getTasks: async (params: any): Promise<TaskListResponse> => {
    const response = await apiClient.get('/tasks', { params });
    return response.data;
  },

  // Tạo nhiệm vụ mới (Hỗ trợ upload file đính kèm qua FormData)
  createTask: async (data: FormData, onUploadProgress?: (progressEvent: any) => void) => {
    const config: AxiosRequestConfig = {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    };
    const response = await apiClient.post('/tasks', data, config);
    return response.data;
  },

  // Cập nhật trạng thái tiến độ (Kéo thả/Chuyển trạng thái)
  updateTaskStatus: async (id: string, status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE') => {
    const response = await apiClient.patch(`/tasks/${id}/status`, { status });
    return response.data;
  },

  deleteTask: async (id: string) => {
    const response = await apiClient.delete(`/tasks/${id}`);
    return response.data;
  },
};