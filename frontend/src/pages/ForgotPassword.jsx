import { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const { data } = await axios.post('/api/auth/forgot-password', { email });
      setMessage(data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Đã xảy ra lỗi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <div className="card glass-morphism" style={{ width: '100%', maxWidth: '400px', padding: '30px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '10px' }}>🔑 Quên mật khẩu</h2>
        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '14px', marginBottom: '20px' }}>
          Nhập email của bạn và chúng tôi sẽ gửi link đặt lại mật khẩu.
        </p>

        {message && <div style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '14px' }}>{message}</div>}
        {error && <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '14px' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Địa chỉ Email</label>
            <input 
              type="email" 
              className="input-field" 
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? '⏳ Đang gửi...' : 'Gửi link khôi phục'}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px' }}>
          <Link to="/login" style={{ color: '#6366f1', textDecoration: 'none' }}>← Quay lại Đăng nhập</Link>
        </div>
      </div>
    </div>
  );
}
