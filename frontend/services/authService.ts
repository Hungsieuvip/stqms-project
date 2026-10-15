import { apiClient } from '../lib/apiClient';

export const authService = {
  login: async (username: string, password: string) => {
    const payload = {
      username: username.trim(),
      username_or_email: username.trim(),
      password: password,
    };

    const response = await apiClient.post('/auth/login', payload);
    return response.data; // Trả về { access_token, token_type, user? }
  },
  
  getMe: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  }
};
