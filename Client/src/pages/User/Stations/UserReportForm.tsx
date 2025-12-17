import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Camera,
  X,
  AlertCircle,
  CheckCircle,
  Upload,
  MapPin,
  FileText,
  Send,
  ChevronLeft
} from 'lucide-react';
import { authService } from '../../../services/authService';
import './UserReportForm.css';

// Mock data types
interface Station {
  id: string;
  name: string;
  address: string;
  visited: boolean;
  image: string;
}

interface ReportFormData {
  stationId: string;
  title: string;
  description: string;
  images: File[];
}

interface ReportHistoryItem {
  report_id: string;
  user_id: number;
  user_name: string;
  station_id: string;
  station_name: string;
  title: string;
  description: string;
  status: 'pending' | 'handled';
  reported_at: string;
  last_update_at?: string;
  images: string[];
  status_history: { status: ReportHistoryItem['status']; at: string; note?: string }[];
}

const UserReportForm: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentUser = authService.getCurrentUser();

  const [stations] = useState<Station[]>([
    {
      id: '1',
      name: 'Trạm sạc Hải Châu',
      address: '123 Trần Phú, Hải Châu, Đà Nẵng',
      visited: true,
      image: 'https://images.unsplash.com/photo-1622737133809-d95047b9e673?w=300&h=200&fit=crop'
    },
    {
      id: '2',
      name: 'Trạm sạc Sơn Trà',
      address: '456 Võ Nguyên Giáp, Sơn Trà, Đà Nẵng',
      visited: true,
      image: 'https://images.unsplash.com/photo-1593941707882-a5bba5338fe2?w=300&h=200&fit=crop'
    },
    {
      id: '3',
      name: 'Trạm sạc Ngũ Hành Sơn',
      address: '789 Ngũ Hành Sơn, Đà Nẵng',
      visited: false,
      image: 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=300&h=200&fit=crop'
    },
    {
      id: '4',
      name: 'Trạm sạc Cầu Rồng',
      address: '101 Bạch Đằng, Hải Châu, Đà Nẵng',
      visited: true,
      image: 'https://images.unsplash.com/photo-1629654291660-3c98113a0438?w=300&h=200&fit=crop'
    }
  ]);

  const [formData, setFormData] = useState<ReportFormData>({
    stationId: '',
    title: '',
    description: '',
    images: []
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ReportFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [showAllStations, setShowAllStations] = useState(false);

  const filteredStations = showAllStations
    ? stations
    : stations.filter(station => station.visited);

  const selectedStation = stations.find(station => station.id === formData.stationId);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name as keyof ReportFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (imagePreviews.length + files.length > 5) {
      alert('Bạn chỉ có thể tải lên tối đa 5 ảnh!');
      return;
    }

    const validFiles = files.filter(file => {
      const isValidType = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type);
      const isValidSize = file.size <= 5 * 1024 * 1024;
      if (!isValidType || !isValidSize) return false;
      return true;
    });

    const newPreviews = validFiles.map(file => URL.createObjectURL(file));

    setFormData(prev => ({ ...prev, images: [...prev.images, ...validFiles] }));
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ReportFormData, string>> = {};

    if (!formData.stationId) newErrors.stationId = 'Vui lòng chọn trạm sạc';
    if (formData.title.trim().length < 6) newErrors.title = 'Tiêu đề tối thiểu 6 ký tự';
    if (formData.description.trim().length < 10)
      newErrors.description = 'Mô tả tối thiểu 10 ký tự';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    setTimeout(() => {
      const existing = localStorage.getItem('user_reports');
      const reports: ReportHistoryItem[] = existing ? JSON.parse(existing) : [];

      const nowIso = new Date().toISOString();
      const stationName = selectedStation?.name || 'Không rõ';
      const reportId = `REP-${Date.now()}`;

      reports.push({
        report_id: reportId,
        user_id: currentUser?.user_id || 0,
        user_name: currentUser?.full_name || 'Người dùng',
        station_id: formData.stationId,
        station_name: stationName,
        title: formData.title,
        description: formData.description,
        status: 'pending',
        reported_at: nowIso,
        last_update_at: nowIso,
        images: imagePreviews,
        status_history: [
          {
            status: 'pending',
            at: nowIso,
            note: 'Báo cáo đã được tạo'
          }
        ]
      });

      localStorage.setItem('user_reports', JSON.stringify(reports));

      imagePreviews.forEach(p => URL.revokeObjectURL(p));
setFormData({ stationId: '', title: '', description: '', images: [] });
      setImagePreviews([]);
      setIsSubmitting(false);
      setSubmitSuccess(true);

      setTimeout(() => setSubmitSuccess(false), 5000);
    }, 1500);
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="user-report-container">
      <button className="back-button" onClick={() => navigate(-1)}>
        <ChevronLeft size={20} />
        <span>Quay lại</span>
      </button>

      <div className="report-header">
        <AlertCircle size={32} />
        <div>
          <h1>Gửi báo cáo sự cố</h1>
          <p>Mô tả chi tiết sự cố bạn gặp phải tại trạm sạc</p>
        </div>
      </div>

      {submitSuccess && (
        <div className="success-message">
          <CheckCircle size={24} />
          <div>
            <strong>Gửi báo cáo thành công!</strong>
            <p>Chúng tôi sẽ xem xét và phản hồi trong vòng 24 giờ.</p>
            <div className="success-actions">
              <button onClick={() => navigate('/user/report/history')}>
                Xem lịch sử báo cáo
              </button>
              <button onClick={() => window.location.reload()}>
                Gửi báo cáo mới
              </button>
            </div>
          </div>
        </div>
      )}

      <form className="report-form" onSubmit={handleSubmit}>
        {/* Trường chọn trạm */}
        <div className="form-section">
          <div className="form-header">
            <label htmlFor="stationId" className="form-label">
              <MapPin size={18} />
              Chọn trạm sạc
            </label>
            <div className="station-toggle">
              <span className="toggle-label">Hiển thị:</span>
              <button
                type="button"
                className={`toggle-button ${!showAllStations ? 'active' : ''}`}
                onClick={() => setShowAllStations(false)}
              >
                Trạm đã đặt
              </button>
              <button
                type="button"
                className={`toggle-button ${showAllStations ? 'active' : ''}`}
                onClick={() => setShowAllStations(true)}
              >
                Tất cả trạm
              </button>
            </div>
          </div>

          <select
            id="stationId"
            name="stationId"
            value={formData.stationId}
            onChange={handleInputChange}
            className={`station-select ${errors.stationId ? 'error' : ''}`}
          >
            <option value="">Chọn trạm sạc</option>
            {filteredStations.map(station => (
              <option key={station.id} value={station.id}>
                {station.name} {station.visited ? '✓' : ''}
              </option>
            ))}
          </select>
{errors.stationId && <div className="error-message">{errors.stationId}</div>}
        </div>

        {/* Trường tiêu đề */}
        <div className="form-section">
          <label htmlFor="title" className="form-label">
            <FileText size={18} />
            Tiêu đề sự cố
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="VD: Trạm sạc không hoạt động, đầu sạc bị hỏng..."
            className={`form-input ${errors.title ? 'error' : ''}`}
          />
          {errors.title && <div className="error-message">{errors.title}</div>}
          <div className="input-hint">Tối thiểu 6 ký tự</div>
        </div>

        {/* Trường mô tả chi tiết */}
        <div className="form-section">
          <label htmlFor="description" className="form-label">
            <AlertCircle size={18} />
            Mô tả chi tiết
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Mô tả chi tiết sự cố, thời gian xảy ra, mức độ nghiêm trọng..."
            rows={6}
            className={`form-textarea ${errors.description ? 'error' : ''}`}
          />
          {errors.description && (
            <div className="error-message">{errors.description}</div>
          )}
          <div className="input-hint">Tối thiểu 10 ký tự</div>
        </div>

        {/* Trường upload ảnh */}
        <div className="form-section">
          <div className="form-header">
            <label className="form-label">
              <Camera size={18} />
              Hình ảnh (tùy chọn)
            </label>
            <div className="image-counter">
              {imagePreviews.length}/5 ảnh
            </div>
          </div>

          <div className="image-upload-area">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              multiple
              style={{ display: 'none' }}
            />
            <button
              type="button"
              className="upload-button"
              onClick={handleCameraClick}
              disabled={imagePreviews.length >= 5}
            >
              <Upload size={24} />
              <span>Thêm ảnh</span>
              <small>JPG, PNG, GIF (tối đa 5MB)</small>
            </button>

            {imagePreviews.length > 0 && (
              <div className="image-previews">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="image-preview-item">
                    <img src={preview} alt={`Preview ${index + 1}`} />
                    <button
                      type="button"
                      className="remove-image"
                      onClick={() => removeImage(index)}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Nút gửi báo cáo */}
        <div className="form-actions">
          <button
            type="submit"
            className="submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="spinner"></div>
                Đang gửi...
              </>
            ) : (
              <>
                <Send size={18} />
                Gửi báo cáo
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserReportForm;