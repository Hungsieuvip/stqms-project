import { apiClient } from '../lib/apiClient';

export const evaluationService = {
  getEvaluations: async (params: any) => {
    const response = await apiClient.get('/evaluations', { params });
    return response.data;
  },
  
  // Gửi hoặc cập nhật bài đánh giá
  submitEvaluation: async (id: string | null, data: any) => {
    if (id) {
      return await apiClient.put(`/evaluations/${id}`, data);
    }
    return await apiClient.post('/evaluations', data);
  },
  
  deleteEvaluation: async (id: string) => {
    return await apiClient.delete(`/evaluations/${id}`);
  }
};