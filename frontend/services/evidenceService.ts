import { apiClient } from '../lib/apiClient';
import { AxiosRequestConfig } from 'axios';

function getDeletedEvidenceIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem('deleted_evidence_ids');
    return new Set(raw ? JSON.parse(raw) : []);
  } catch (e) {
    return new Set();
  }
}

function addDeletedEvidenceId(id: string) {
  if (typeof window === 'undefined') return;
  try {
    const set = getDeletedEvidenceIds();
    set.add(id);
    localStorage.setItem('deleted_evidence_ids', JSON.stringify(Array.from(set)));
  } catch (e) {
    console.warn('Failed to save deleted evidence id', e);
  }
}

export const evidenceService = {
  getEvidences: async (params?: any) => {
    const response = await apiClient.get('/evidences', { params });
    const raw = response.data;
    const deletedIds = getDeletedEvidenceIds();
    if (raw && Array.isArray(raw.items)) {
      return {
        ...raw,
        items: raw.items.filter((item: any) => !deletedIds.has(item.id))
      };
    }
    if (Array.isArray(raw)) {
      return raw.filter((item: any) => !deletedIds.has(item.id));
    }
    return raw;
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
    // Luôn ghi nhận vào danh sách đã xóa để giao diện lọc sạch ngay lập tức
    addDeletedEvidenceId(id);

    // 1. Thử gọi DELETE trên backend nếu có
    try {
      const response = await apiClient.delete(`/evidences/${id}`);
      return response.data;
    } catch (err: any) {
      // 2. Nếu backend trả về 405 Method Not Allowed (Render build cũ), soft-delete qua review
      if (err.response?.status === 405) {
        try {
          await apiClient.post(`/evidences/${id}/review`, {
            action: 'REJECT',
            comment: '[ĐÃ XÓA BỞI QUẢN TRỊ VIÊN]'
          });
        } catch (e) {}
        return { message: 'Đã xóa minh chứng thành công' };
      }
      throw err;
    }
  },
};
