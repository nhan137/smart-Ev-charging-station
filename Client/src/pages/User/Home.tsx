import { useNavigate } from 'react-router-dom';
import { Zap, ChevronRight, MapPin, Calendar, Activity, Building2 } from 'lucide-react';
import { useState } from 'react';
import RegisterModal from '../Auth/RegisterModal';
import QuickBookingModal from './components/QuickBookingModal';
import './Home.css';

const Home = () => {

  const navigate = useNavigate();
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);

  const features = [
    {
      icon: <MapPin size={40} />,
      title: 'Tìm trạm sạc gần bạn qua bản đồ',
      desc: 'Xem vị trí các trạm sạc xung quanh bạn trên bản đồ với thông tin chi tiết về trạng thái và giá cả',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: <Calendar size={40} />,
      title: 'Đặt lịch sạc theo thời gian linh hoạt',
      desc: 'Đặt trước lịch sạc theo khung giờ phù hợp, tránh chờ đợi và tối ưu thời gian của bạn',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: <Activity size={40} />,
      title: 'Theo dõi tiến trình sạc realtime',
      desc: 'Cập nhật trạng thái sạc theo thời gian thực, biết chính xác khi nào xe của bạn sạc đầy',
      color: 'from-purple-500 to-pink-500'
    }
  ];

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section-new">
        <div className="hero-container-new">
          <div className="hero-content-new">
            <div className="hero-badge">
              <Zap size={16} />
              <span>GIẢI PHÁP SẠC XE ĐIỆN THÔNG MINH</span>
            </div>

            <h1 className="hero-title-new">
              Trạm Sạc Thông Minh - 
              <span className="title-gradient"> Kết Nối Tương Lai</span>
            </h1>

            <p className="hero-description-new">
              Hệ thống trạm sạc xe điện hiện đại nhất Việt Nam. Tìm kiếm, đặt lịch và thanh toán 
              nhanh chóng với công nghệ AI tiên tiến.
            </p>

            <div className="hero-buttons">
              <button 
                className="btn-primary-modern"
                onClick={() => setShowRegisterModal(true)}
              >
                <Zap size={20} />
                <span>Bắt đầu trải nghiệm</span>
              </button>

              <button 
                className="btn-secondary-modern"
                onClick={() => navigate('/stations')}
              >
                <Building2 size={20} />
                <span>Xem trạm sạc</span>
              </button>
            </div>
          </div>

          <div className="hero-image-new">
            <img 
              src="https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800&h=600&fit=crop" 
              alt="Xe điện đang sạc"
              onError={(e) => {
                e.currentTarget.src = "https://via.placeholder.com/800x600/1e293b/3b82f6?text=EV+Charging";
              }}
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section-new">
        <div className="section-container">
          <div className="section-header-modern">
            <h2 className="section-title-modern">
              Tính năng <span className="text-gradient-modern">nổi bật</span>
            </h2>
            <div className="section-divider-modern"></div>
          </div>

          <div className="features-grid-new">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="feature-card-icon"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="feature-icon-wrapper" data-color={feature.color}>
                  {feature.icon}
                </div>
                <h3 className="feature-title-new">{feature.title}</h3>
                <p className="feature-desc-new">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Experience Section */}
      <section className="experience-section">
        <div className="section-container">
          <div className="section-header-modern">
            <h2 className="section-title-modern">
              Trải nghiệm <span className="text-gradient-modern">thực tế</span>
            </h2>
            <div className="section-divider-modern"></div>
          </div>

          <div className="video-container">
            <div className="video-wrapper">
              <img 
                src="https://images.unsplash.com/photo-1617704548623-340376564e68?w=1200&h=675&fit=crop" 
                alt="Video demo"
                className="video-placeholder"
                onError={(e) => {
                  e.currentTarget.src = "https://via.placeholder.com/1200x675/1e293b/3b82f6?text=Video+Demo";
                }}
              />
              <div className="play-button">
                <Zap size={48} />
              </div>
            </div>
            <p className="video-caption">
              Xem hành trình người dùng từ tìm trạm, đặt lịch đến hoàn thành sạc xe
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section-new">
        <div className="cta-background-modern">
          <div className="cta-gradient-orb cta-gradient-orb-1"></div>
          <div className="cta-gradient-orb cta-gradient-orb-2"></div>
        </div>
        <div className="cta-content-modern">
          <Zap size={64} className="cta-icon" />
          <h2 className="cta-title-modern">Sẵn sàng trải nghiệm?</h2>
          <p className="cta-subtitle-modern">
            Hãy bắt đầu hành trình sạc xe điện thông minh của bạn ngay hôm nay
          </p>
          <button 
            className="btn-primary-modern btn-large-modern"
            onClick={() => setShowRegisterModal(true)}
          >
            <span>Bắt đầu ngay</span>
            <ChevronRight size={24} />
          </button>
        </div>
      </section>

      <RegisterModal 
        isOpen={showRegisterModal} 
        onClose={() => setShowRegisterModal(false)} 
      />

      <QuickBookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
      />
    </div>
  );
};

export default Home;
