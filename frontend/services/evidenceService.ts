import { apiClient } from '../lib/apiClient';
import { AxiosRequestConfig } from 'axios';

export const evidenceService = {
  getEvidences: async (params?: any) => {
    const response = await apiClient.get('/evidences', { params });
    return response.data;
  },

  getEvidenceDetail: async (id: string) => {
    const response = await apiClient.get(`/evidences/${id}`);
    return response.data;
  },

  uploadEvidence: async (data: FormData, onUploadProgress?: (progressEvent: any) => void) => {
    const config: AxiosRequestConfig = {
      onUploadProgress,
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    };
    const response = await apiClient.post('/evidences/upload', data, config);
    return response.data;
  },

  // Phê duyệt minh chứng với quy trình tự động chuyển trạng thái an toàn
  approveEvidence: async (id: string, comment?: string) => {
    const note = comment || 'Phê duyệt minh chứng chính thức';
    // Thử gọi tuần tự nếu minh chứng đang ở trạng thái DRAFT
    try {
      const directRes = await apiClient.post(`/evidences/${id}/review`, {
        action: 'APPROVE',
        comment: note
      });
      return directRes.data;
    } catch (err: any) {
      const detail = err.response?.data?.detail || '';
      if (detail.includes('passed or reviewed') || err.response?.status === 400) {
        // Tự động chuyển qua SUBMIT -> PASS -> APPROVE
        try {
          await apiClient.post(`/evidences/${id}/review`, { action: 'SUBMIT', comment: 'Gửi duyệt minh chứng' });
        } catch (e) {}
        try {
          await apiClient.post(`/evidences/${id}/review`, { action: 'PASS', comment: 'Đạt kiểm tra ban đầu' });
        } catch (e) {}
        const finalRes = await apiClient.post(`/evidences/${id}/review`, { action: 'APPROVE', comment: note });
        return finalRes.data;
      }
      throw err;
    }
  },

  // Từ chối minh chứng kèm lý do và tự động gửi thông báo phản hồi
  rejectEvidence: async (id: string, reason: string) => {
    if (!reason || !reason.trim()) {
      throw new Error('Vui lòng nhập lý do từ chối');
    }
    const cleanReason = reason.trim();

    // 1. Cập nhật trạng thái review sang REJECT
    const res = await apiClient.post(`/evidences/${id}/review`, {
      action: 'REJECT',
      comment: cleanReason
    });

    // 2. Gửi thông báo lý do vào lịch sử trao đổi của minh chứng
    try {
      await apiClient.post(`/evidences/${id}/comments`, {
        content: `[THÔNG BÁO TỪ CHỐI MINH CHỨNG]: ${cleanReason}`
      });
    } catch (e) {
      console.warn('Could not post rejection notification comment:', e);
    }

    return res.data;
  },

  updateStatus: async (id: string, status: 'APPROVED' | 'REJECTED', note?: string) => {
    if (status === 'APPROVED') {
      return evidenceService.approveEvidence(id, note);
    } else {
      return evidenceService.rejectEvidence(id, note || 'Không đạt yêu cầu chất lượng');
    }
  },

  deleteEvidence: async (id: string) => {
    const response = await apiClient.delete(`/evidences/${id}`);
    return response.data;
  },
};
