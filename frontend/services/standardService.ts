import { apiClient } from '../lib/apiClient'; 
import { Standard, Criterion, Requirement } from '../types/standard';

function normalizeCriterion(c: any): Criterion {
  if (!c) return c;
  const is_active = c.status ? c.status === 'ACTIVE' : (c.is_active !== false);
  return {
    ...c,
    sequence_num: c.sequence_num ?? c.sequence ?? 1,
    is_active,
    status: c.status || (is_active ? 'ACTIVE' : 'INACTIVE')
  };
}

function normalizeStandard(s: any): Standard {
  if (!s) return s;
  const is_active = s.status ? s.status === 'ACTIVE' : (s.is_active !== false);
  const criteria = Array.isArray(s.criteria) ? s.criteria.map(normalizeCriterion) : [];
  return {
    ...s,
    is_active,
    status: s.status || (is_active ? 'ACTIVE' : 'INACTIVE'),
    criteria
  };
}

export const standardService = {
  // --- STANDARDS ---
  getStandards: async (params?: any) => {
    const response = await apiClient.get('/standards', { params });
    const raw = response.data;
    if (Array.isArray(raw)) {
      return raw.map(normalizeStandard);
    }
    if (raw && Array.isArray(raw.items)) {
      return { ...raw, items: raw.items.map(normalizeStandard) };
    }
    return raw;
  },
  createStandard: async (data: Partial<Standard>) => {
    const response = await apiClient.post('/standards', data);
    return normalizeStandard(response.data);
  },
  updateStandard: async (id: string, data: Partial<Standard>) => {
    const response = await apiClient.put(`/standards/${id}`, data);
    return normalizeStandard(response.data);
  },
  deleteStandard: async (id: string) => {
    try {
      const response = await apiClient.delete(`/standards/${id}`);
      return response.data;
    } catch (err: any) {
      // Nếu backend chưa hỗ trợ DELETE (405 Method Not Allowed), chuyển sang soft delete
      if (err.response?.status === 405) {
        console.warn('Backend 405 on DELETE standard, falling back to PUT status INACTIVE...');
        const response = await apiClient.put(`/standards/${id}`, {
          status: 'INACTIVE',
          is_active: false
        });
        return response.data;
      }
      throw err;
    }
  },

  // --- CRITERIA ---
  getCriteria: async (params?: any) => {
    const response = await apiClient.get('/criteria', { params });
    const raw = response.data;
    if (Array.isArray(raw)) {
      return raw.map(normalizeCriterion);
    }
    if (raw && Array.isArray(raw.items)) {
      return { ...raw, items: raw.items.map(normalizeCriterion) };
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
      status: data.status || (data.is_active !== undefined ? (data.is_active ? 'ACTIVE' : 'INACTIVE') : undefined)
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
