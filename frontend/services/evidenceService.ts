import { apiClient } from '../lib/apiClient';
import { Evidence, EvidenceListResponse } from '../types/evidence';
import { AxiosRequestConfig } from 'axios';

export const evidenceService = {
  getEvidences: async (params?: any): Promise<EvidenceListResponse> => {
    const response = await apiClient.get('/evidences', { params });
    return response.data;
  },

  // SỬA: Bỏ header Content-Type cố định để trình duyệt tự động gán boundary chính xác
  uploadEvidence: async (data: FormData, onUploadProgress?: (progressEvent: any) => void) => {
    const config: AxiosRequestConfig = {
      onUploadProgress,
    };
    const response = await apiClient.post('/evidences/upload', data, config);
    return response.data;
  },

  updateStatus: async (id: string, status: 'APPROVED' | 'REJECTED', note?: string) => {
    const response = await apiClient.patch(`/evidences/${id}/workflow`, { status, note });
    return response.data;
  },

  deleteEvidence: async (id: string) => {
    const response = await apiClient.delete(`/evidences/${id}`);
    return response.data;
  },
};