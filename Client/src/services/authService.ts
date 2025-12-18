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
