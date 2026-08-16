import axios from 'axios';

// Giả định backend đang chạy ở localhost:8000
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: Tự động gắn Token vào mọi request
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor: Xử lý lỗi (ví dụ: Token hết hạn -> Xóa token và đá về Login)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);