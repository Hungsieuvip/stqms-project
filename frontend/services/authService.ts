import { apiClient } from '../lib/apiClient';

export const authService = {
  login: async (username: string, password: string) => {
    // FastAPI mặc định dùng OAuth2PasswordRequestForm (FormData)
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    const response = await apiClient.post('/auth/login', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data; // Trả về { access_token, token_type }
  },
  
  getMe: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  }
};