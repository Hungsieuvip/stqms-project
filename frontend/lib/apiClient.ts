import axios from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Tự động đính kèm token vào mọi request gửi đi
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      let token: any = localStorage.getItem('access_token') || localStorage.getItem('token');
      
      if (token && token !== 'null' && token !== 'undefined') {
        // --- BỘ LỌC LÀM SẠCH TOKEN ---
        if (typeof token === 'string' && token.startsWith('"') && token.endsWith('"')) {
          token = token.slice(1, -1);
        } 
        else if (typeof token === 'string' && token.startsWith('{')) {
          try {
            const parsed = JSON.parse(token);
            token = parsed.access_token || parsed.token || token;
          } catch (e) {
            console.error("Lỗi parse JSON token", e);
          }
        }

        // Ép kiểu chắc chắn 100% là chuỗi để TypeScript hết gạch đỏ ở substring
        const finalToken = String(token);

        console.log("🚀 Token sạch đang gửi đi:", finalToken.substring(0, 15) + "...");
        
        if (config.headers) {
          (config.headers as any).Authorization = `Bearer ${finalToken}`;
        }
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Bắt lỗi trả về từ Backend
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== 'undefined') {
      // Bắt 401: Đá về login
      if (error.response?.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('token');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
      // Bắt 403: Báo lỗi ra màn hình (Không văng app)
      else if (error.response?.status === 403) {
        console.error("⛔ LỖI 403: BỊ TỪ CHỐI QUYỀN TRUY CẬP");
        alert("Lỗi 403: Tài khoản của bạn không có quyền xem dữ liệu này. Hãy đăng nhập bằng tài khoản Admin nhé!");
      }
    }
    
    console.error("🛑 API Error Detail:", error.response?.data);
    return Promise.reject(error);
  }
);