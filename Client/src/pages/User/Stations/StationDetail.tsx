import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { stationService } from '../../../services/stationService';
import { favoriteService } from '../../../services/favoriteService';
import type { Station, Feedback } from '../../../types';

const StationDetail = () => {
  const { station_id } = useParams();
  const navigate = useNavigate();
  const [station, setStation] = useState<Station | null>(null);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStationDetail();
  }, [station_id]);

  const loadStationDetail = async () => {
    try {
      setLoading(true);
      const stationData = await stationService.getStationById(Number(station_id));
      const feedbackData = await stationService.getFeedbacks(Number(station_id));
      setStation(stationData);
      setFeedbacks(feedbackData);
    } catch (error) {
      console.error('Error loading station detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFavorite = async () => {
    try {
      await favoriteService.addFavorite(Number(station_id));
      alert('Đã lưu trạm yêu thích');
    } catch (error) {
      console.error('Error adding favorite:', error);
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Đang tải...</div>;
  if (!station) return <div style={{ padding: '20px' }}>Không tìm thấy trạm</div>;

  const avgRating = feedbacks.length > 0 
    ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length 
    : 0;

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Station Info */}
      <img 
        src={station.avatar_url || '/placeholder.jpg'} 
        alt={station.station_name}
        style={{ width: '100%', height: '400px', objectFit: 'cover', borderRadius: '8px' }}
      />
      
      <h1>{station.station_name}</h1>
      <p><strong>Địa chỉ:</strong> {station.address} <a href={`https://maps.google.com/?q=${station.latitude},${station.longitude}`} target="_blank">Xem bản đồ</a></p>
      <p><strong>SĐT:</strong> <a href={`tel:${station.contact_phone}`}>{station.contact_phone}</a></p>
      <p><strong>Giá:</strong> {station.price_per_kwh} đ/kWh</p>
      <p><strong>Công suất:</strong> {station.charging_power} kW</p>
      <p><strong>Loại trạm:</strong> {station.station_type}</p>
      <p><strong>Đầu sạc:</strong> {station.connector_types}</p>
      <p><strong>Giờ mở:</strong> {station.opening_hours}</p>
      <p><strong>Chỗ trống:</strong> {station.available_slots}/{station.total_slots}</p>
      <p><strong>Trạng thái:</strong> {station.status}</p>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '10px', margin: '20px 0' }}>
        <button onClick={() => navigate(`/bookings/create?station_id=${station.station_id}`)}>
          Đặt lịch
        </button>
        <button onClick={() => navigate('/user/feedbacks-favorites')}>
          Đánh giá ⭐
        </button>
        <button onClick={handleAddFavorite}>
          ❤️ Lưu
        </button>
        <button onClick={() => window.open(`tel:${station.contact_phone}`)}>
          Gọi liên hệ
        </button>
        <button onClick={() => window.open(`https://maps.google.com/?q=${station.latitude},${station.longitude}`)}>
          Chỉ đường
        </button>
      </div>

      {/* Ratings Section */}
      <div style={{ marginTop: '40px' }}>
        <h2>Đánh giá</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '36px', fontWeight: 'bold' }}>{avgRating.toFixed(1)}</div>
            <div>{'⭐'.repeat(Math.round(avgRating))}</div>
            <div>({feedbacks.length} đánh giá)</div>
          </div>
        </div>

        {/* Feedback List */}
        <div>
          {feedbacks.slice(0, 5).map((feedback) => (
            <div key={feedback.feedback_id} style={{ borderBottom: '1px solid #ddd', padding: '15px 0' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#ccc' }}></div>
                <div>
                  <div style={{ fontWeight: 'bold' }}>User #{feedback.user_id}</div>
                  <div>{'⭐'.repeat(feedback.rating)}</div>
                </div>
              </div>
              <p>{feedback.comment}</p>
              <small>{new Date(feedback.created_at).toLocaleDateString('vi-VN')}</small>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StationDetail;
