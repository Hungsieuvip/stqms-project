import { apiClient } from '../lib/apiClient'; 
import { Standard, Criterion, Requirement } from '../types/standard';

export function sortCriteria<T extends { code?: string; sequence_num?: number; sequence?: number }>(list: T[]): T[] {
  return [...list].sort((a, b) => {
    // 1. So sánh mã tự nhiên (1.1 < 1.2 < 1.9 < 1.10)
    const codeA = a.code || '';
    const codeB = b.code || '';
    if (codeA && codeB) {
      const cmp = codeA.localeCompare(codeB, undefined, { numeric: true, sensitivity: 'base' });
      if (cmp !== 0) return cmp;
    }
    // 2. So sánh sequence
    const seqA = a.sequence_num ?? a.sequence ?? 999;
    const seqB = b.sequence_num ?? b.sequence ?? 999;
    return seqA - seqB;
  });
}

export function sortStandards<T extends { code?: string; sequence?: number; sequence_num?: number }>(list: T[]): T[] {
  return [...list].sort((a, b) => {
    // 1. Trích xuất phần số trong mã (TC01 -> 1, TC02 -> 2, TC-1 -> 1)
    const numA = parseInt((a.code || '').replace(/\D/g, '') || '999', 10);
    const numB = parseInt((b.code || '').replace(/\D/g, '') || '999', 10);
    if (numA !== numB) return numA - numB;

    // 2. So sánh theo sequence
    const seqA = a.sequence ?? a.sequence_num ?? 999;
    const seqB = b.sequence ?? b.sequence_num ?? 999;
    if (seqA !== seqB) return seqA - seqB;

    // 3. So sánh chuỗi ký tự tự nhiên
    return (a.code || '').localeCompare(b.code || '', undefined, { numeric: true, sensitivity: 'base' });
  });
}

function normalizeCriterion(c: any): Criterion {
  if (!c) return c;
  const isInactive = c.status === 'INACTIVE' || c.is_active === false;
  const is_active = !isInactive && (c.status === 'ACTIVE' || c.is_active !== false);
  return {
    ...c,
    sequence_num: c.sequence_num ?? c.sequence ?? 1,
    is_active,
    status: is_active ? 'ACTIVE' : 'INACTIVE'
  };
}

function normalizeStandard(s: any): Standard {
  if (!s) return s;
  const isRedundant = s.code?.startsWith('TC-') && (!s.criteria || s.criteria.length === 0);
  // Tiêu chuẩn đã xóa (INACTIVE) phải luôn giữ là INACTIVE
  const isInactive = s.status === 'INACTIVE' || s.is_active === false;
  const is_active = !isRedundant && !isInactive && (s.status === 'ACTIVE' || s.is_active === true);
  const rawCriteria = Array.isArray(s.criteria) ? s.criteria.map(normalizeCriterion) : [];
  return {
    ...s,
    is_active,
    status: is_active ? 'ACTIVE' : 'INACTIVE',
    criteria: sortCriteria(rawCriteria)
  };
}

export const standardService = {
  // --- STANDARDS ---
  getStandards: async (params?: any) => {
    const response = await apiClient.get('/standards', { params });
    const raw = response.data;
    if (Array.isArray(raw)) {
      return sortStandards(raw.map(normalizeStandard));
    }
    if (raw && Array.isArray(raw.items)) {
      return { ...raw, items: sortStandards(raw.items.map(normalizeStandard)) };
    }
    return raw;
  },
  createStandard: async (data: Partial<Standard> & { status?: string }) => {
    const payload = {
      ...data,
      status: data.status || (data.is_active === false ? 'INACTIVE' : 'ACTIVE')
    };
    const response = await apiClient.post('/standards', payload);
    return normalizeStandard(response.data);
  },
  updateStandard: async (id: string, data: Partial<Standard> & { status?: string }) => {
    const payload = {
      ...data,
      status: data.status || (data.is_active !== undefined ? (data.is_active ? 'ACTIVE' : 'INACTIVE') : 'ACTIVE')
    };
    const response = await apiClient.put(`/standards/${id}`, payload);
    return normalizeStandard(response.data);
  },
  deleteStandard: async (id: string, criteria?: Criterion[]) => {
    // 1. Lấy danh sách tiêu chí nếu chưa truyền
    let critList = criteria;
    if (!critList || critList.length === 0) {
      try {
        const stdRes = await apiClient.get(`/standards/${id}`);
        critList = stdRes.data?.criteria || [];
      } catch (e) {
        critList = [];
      }
    }

    // 2. Xóa toàn bộ tiêu chí con trước để đảm bảo DB sạch
    if (critList && critList.length > 0) {
      for (const crit of critList) {
        try {
          await apiClient.delete(`/criteria/${crit.id}`);
        } catch (e) {
          console.warn(`Could not delete sub-criterion ${crit.id}:`, e);
        }
      }
    }

    // 3. Thử gọi DELETE tiêu chuẩn, nếu backend trả về 405 (Render build cũ), fallback sang PUT status INACTIVE
    try {
      const response = await apiClient.delete(`/standards/${id}`);
      return response.data;
    } catch (err: any) {
      const response = await apiClient.put(`/standards/${id}`, {
        status: 'INACTIVE',
        is_active: false
      });
      return response.data;
    }
  },

  // --- CRITERIA ---
  getCriteria: async (params?: any) => {
    const response = await apiClient.get('/criteria', { params });
    const raw = response.data;
    if (Array.isArray(raw)) {
      return sortCriteria(raw.map(normalizeCriterion));
    }
    if (raw && Array.isArray(raw.items)) {
      return { ...raw, items: sortCriteria(raw.items.map(normalizeCriterion)) };
    }
    return raw;
  },
  createCriterion: async (data: Partial<Criterion> & { sequence?: number; status?: string }) => {
    const payload = {
      ...data,
      sequence: data.sequence ?? data.sequence_num ?? 1,
      status: data.status || (data.is_active === false ? 'INACTIVE' : 'ACTIVE')
    };
    const response = await apiClient.post('/criteria', payload);
    return normalizeCriterion(response.data);
  },
  updateCriterion: async (id: string, data: Partial<Criterion> & { sequence?: number; status?: string }) => {
    const payload = {
      ...data,
      sequence: data.sequence ?? data.sequence_num,
      status: data.status || (data.is_active !== undefined ? (data.is_active ? 'ACTIVE' : 'INACTIVE') : 'ACTIVE')
    };
    const response = await apiClient.put(`/criteria/${id}`, payload);
    return normalizeCriterion(response.data);
  },
  deleteCriterion: async (id: string) => {
    const response = await apiClient.delete(`/criteria/${id}`);
    return response.data;
  },

  // --- REQUIREMENTS ---
  getRequirements: async (params?: any) => {
    const response = await apiClient.get('/requirements', { params });
    return response.data;
  },
  createRequirement: async (data: Partial<Requirement>) => {
    const response = await apiClient.post('/requirements', data);
    return response.data;
  },
  updateRequirement: async (id: string, data: Partial<Requirement>) => {
    const response = await apiClient.put(`/requirements/${id}`, data);
    return response.data;
  },
  deleteRequirement: async (id: string) => {
    const response = await apiClient.delete(`/requirements/${id}`);
    return response.data;
  },

  // --- AI IMPORT ---
  aiParse: async (formData: FormData) => {
    const response = await apiClient.post('/standards/ai-parse', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  aiImport: async (payload: any) => {
    const response = await apiClient.post('/standards/ai-import', payload);
    return response.data;
  },
};
