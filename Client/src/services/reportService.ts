import api from './api';

export const reportService = {
  // Create report (User gửi báo cáo)
  createReport: async (data: {
    station_id: number;
    title: string;
    description: string;
    images?: File[];
  }) => {
    try {
      const formData = new FormData();
      formData.append('station_id', data.station_id.toString());
      formData.append('title', data.title);
      formData.append('description', data.description);
      
      if (data.images && data.images.length > 0) {
        data.images.forEach((image) => {
          formData.append('images', image);
        });
      }

      const response = await api.post('/reports', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể gửi báo cáo');
    }
  },

  // Get user's reports
  getMyReports: async () => {
    try {
      const response = await api.get('/reports/my');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể tải lịch sử báo cáo');
    }
  },

  // Get report detail
  getReportDetail: async (reportId: string) => {
    try {
      const response = await api.get(`/reports/${reportId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể tải chi tiết báo cáo');
    }
  }
};

