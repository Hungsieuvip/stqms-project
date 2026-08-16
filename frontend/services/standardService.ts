import { apiClient } from '../lib/apiClient'; 
import { Standard, Criterion, Requirement } from '../types/standard';

export const standardService = {
  // --- STANDARDS ---
  getStandards: async (params?: any) => {
    const response = await apiClient.get('/standards', { params });
    return response.data;
  },
  createStandard: async (data: Partial<Standard>) => {
    const response = await apiClient.post('/standards', data);
    return response.data;
  },
  updateStandard: async (id: string, data: Partial<Standard>) => {
    const response = await apiClient.put(`/standards/${id}`, data);
    return response.data;
  },
  deleteStandard: async (id: string) => {
    const response = await apiClient.delete(`/standards/${id}`);
    return response.data;
  },

  // --- CRITERIA ---
  getCriteria: async (params?: any) => {
    const response = await apiClient.get('/criteria', { params });
    return response.data;
  },
  createCriterion: async (data: Partial<Criterion>) => {
    const response = await apiClient.post('/criteria', data);
    return response.data;
  },
  updateCriterion: async (id: string, data: Partial<Criterion>) => {
    const response = await apiClient.put(`/criteria/${id}`, data);
    return response.data;
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
};