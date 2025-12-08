import { mockUsers, getNextId } from './mockData';

// Mock mode - set to false to use real API
const USE_MOCK = true;

export const authService = {
  login: async (email: string, password: string) => {
    if (USE_MOCK) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const user = mockUsers.find(u => u.email === email && u.password === password);
      if (!user) {
        throw new Error('Email hoặc mật khẩu không đúng');
      }
      
      const token = 'mock-token-' + Date.now();
      const userData = { ...user };
      delete (userData as any).password;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      return { token, user: userData };
    }
    
    // Real API call (commented out for mock mode)
    // const response = await api.post('/auth/login', { email, password });
    // if (response.data.token) {
    //   localStorage.setItem('token', response.data.token);
    //   localStorage.setItem('user', JSON.stringify(response.data.user));
    // }
    // return response.data;
  },

  register: async (data: { email: string; password: string; full_name: string; phone?: string }) => {
    if (USE_MOCK) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check if email already exists
      if (mockUsers.find(u => u.email === data.email)) {
        throw new Error('Email đã được sử dụng');
      }
      
      const newUser = {
        user_id: getNextId(mockUsers, 'user_id'),
        email: data.email,
        password: data.password,
        full_name: data.full_name,
        phone: data.phone || '',
        role: 'user'
      };
      
      mockUsers.push(newUser);
      
      const token = 'mock-token-' + Date.now();
      const userData = { ...newUser };
      delete (userData as any).password;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      return { token, user: userData };
    }
    
    // Real API call (commented out for mock mode)
    // const response = await api.post('/auth/register', { ...data, role_id: 1 });
    // if (response.data.token) {
    //   localStorage.setItem('token', response.data.token);
    //   localStorage.setItem('user', JSON.stringify(response.data.user));
    // }
    // return response.data;
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
