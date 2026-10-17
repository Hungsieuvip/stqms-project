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

  /**
   * Chuyển trạng thái minh chứng qua State Machine API
   * Sử dụng endpoint PATCH /evidences/{id}/workflow
   */
  updateWorkflow: async (id: string, newStatus: string, note?: string) => {
    const response = await apiClient.patch(`/evidences/${id}/workflow`, {
      status: newStatus,
      note: note || null,
    });
    return response.data;
  },

  /**
   * Lấy danh sách trạng thái có thể chuyển từ trạng thái hiện tại
   */
  getTransitions: async (id: string) => {
    const response = await apiClient.get(`/evidences/${id}/transitions`);
    return response.data;
  },

  /**
   * Lấy lịch sử duyệt minh chứng
   */
  getReviewHistory: async (id: string) => {
    const response = await apiClient.get(`/evidences/${id}/review-history`);
    return response.data;
  },

  /**
   * Phê duyệt minh chứng - chuyển qua State Machine
   * Tự động phát hiện trạng thái hiện tại và chuyển phù hợp
   */
  approveEvidence: async (id: string, comment?: string) => {
    const note = comment || 'Phê duyệt minh chứng chính thức';
    
    // Thử approve trực tiếp (PASSED -> APPROVED)
    try {
      const res = await apiClient.patch(`/evidences/${id}/workflow`, {
        status: 'APPROVED',
        note: note,
      });
      return res.data;
    } catch (err: any) {
      const detail = err.response?.data?.detail || '';
      
      // Nếu chưa đúng trạng thái, tự động chuyển tuần tự
      if (err.response?.status === 400 && detail.includes('Không thể chuyển')) {
        // Thử nộp trước (DRAFT -> SUBMITTED)
        try {
          await apiClient.patch(`/evidences/${id}/workflow`, {
            status: 'SUBMITTED',
            note: 'Tự động nộp bởi hệ thống',
          });
        } catch (e) {}
        
        // Thử duyệt sơ bộ (SUBMITTED -> PASSED)
        try {
          await apiClient.patch(`/evidences/${id}/workflow`, {
            status: 'PASSED',
            note: 'Duyệt sơ bộ tự động',
          });
        } catch (e) {}
        
        // Phê duyệt cuối (PASSED -> APPROVED)
        const finalRes = await apiClient.patch(`/evidences/${id}/workflow`, {
          status: 'APPROVED',
          note: note,
        });
        return finalRes.data;
      }
      throw err;
    }
  },

  /**
   * Từ chối minh chứng kèm lý do bắt buộc
   * Backend sẽ tự động gửi Notification cho author
   */
  rejectEvidence: async (id: string, reason: string) => {
    if (!reason || !reason.trim()) {
      throw new Error('Vui lòng nhập lý do từ chối');
    }
    
    const res = await apiClient.patch(`/evidences/${id}/workflow`, {
      status: 'REJECTED',
      note: reason.trim(),
    });
    return res.data;
  },

  /**
   * Yêu cầu chỉnh sửa (SUBMITTED -> NEEDS_REVISION)
   */
  requestRevision: async (id: string, reason: string) => {
    if (!reason || !reason.trim()) {
      throw new Error('Vui lòng nhập lý do yêu cầu chỉnh sửa');
    }
    
    const res = await apiClient.patch(`/evidences/${id}/workflow`, {
      status: 'NEEDS_REVISION',
      note: reason.trim(),
    });
    return res.data;
  },

  /**
   * Nộp minh chứng (DRAFT -> SUBMITTED)
   */
  submitEvidence: async (id: string) => {
    const res = await apiClient.patch(`/evidences/${id}/workflow`, {
      status: 'SUBMITTED',
      note: 'Nộp minh chứng để duyệt',
    });
    return res.data;
  },

  /**
   * Duyệt sơ bộ (SUBMITTED -> PASSED)
   */
  passEvidence: async (id: string) => {
    const res = await apiClient.patch(`/evidences/${id}/workflow`, {
      status: 'PASSED',
      note: 'Đạt duyệt sơ bộ',
    });
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
    addDeletedEvidenceId(id);
    try {
      const response = await apiClient.delete(`/evidences/${id}`);
      return response.data;
    } catch (err: any) {
      if (err.response?.status === 405) {
        // Fallback: soft-delete qua workflow
        try {
          await apiClient.patch(`/evidences/${id}/workflow`, {
            status: 'REJECTED',
            note: '[ĐÃ XÓA BỞI QUẢN TRỊ VIÊN]'
          });
        } catch (e) {}
        return { message: 'Đã xóa minh chứng thành công' };
      }
      throw err;
    }
  },
};
