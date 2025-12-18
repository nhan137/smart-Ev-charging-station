import api from './api';

export const authService = {
  login: async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      
      if (response.data.success && response.data.data.token) {
        const { token, user } = response.data.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        return { token, user };
      }
      
      throw new Error(response.data.message || 'Đăng nhập thất bại');
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Email hoặc mật khẩu không đúng');
    }
  },

  register: async (data: { email: string; password: string; full_name: string; phone?: string }) => {
    try {
      const response = await api.post('/auth/register', {
        full_name: data.full_name,
        email: data.email,
        password: data.password,
        phone: data.phone || null,
        role_id: 1
      });
      
      if (response.data.success && response.data.data.token) {
        const { token, user } = response.data.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        return { token, user };
      }
      
      throw new Error(response.data.message || 'Đăng ký thất bại');
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Đã xảy ra lỗi khi đăng ký. Vui lòng thử lại.');
    }
  },

  forgotPassword: async (email: string) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      
      if (response.data.success) {
        return {
          success: true,
          message: response.data.message,
          // In development mode, backend returns resetUrl and token
          resetUrl: response.data.resetUrl,
          token: response.data.token
        };
      }
      
      throw new Error(response.data.message || 'Không thể gửi email đặt lại mật khẩu');
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Có lỗi xảy ra. Vui lòng thử lại.');
    }
  },

  resetPassword: async (token: string, newPassword: string) => {
    try {
      const response = await api.post('/auth/reset-password', { 
        token, 
        newPassword 
      });
      
      if (response.data.success) {
        return {
          success: true,
          message: response.data.message
        };
      }
      
      throw new Error(response.data.message || 'Không thể đặt lại mật khẩu');
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.');
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  getToken: () => {
    return localStorage.getItem('token');
  }
};
