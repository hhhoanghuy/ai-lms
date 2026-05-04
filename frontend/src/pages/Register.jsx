import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp!');
      return;
    }
    setError('');
    try {
      await axios.post('/api/auth/register', form);
      alert('Đăng ký thành công! Vui lòng đăng nhập.');
      navigate('/login');
    } catch (err) {
      alert(err.response?.data?.message || 'Đăng ký thất bại');
    }
  };

  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '20px' }}>
      <div className="card glass-morphism" style={{ width: '400px' }}>
        <h2 style={{ marginBottom: '20px', textAlign: 'center' }}>Tham gia AI LMS</h2>
        
        {error && <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '14px', textAlign: 'center' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label>Họ và tên</label>
            <input className="input-field" type="text" placeholder="Nguyễn Văn A" onChange={(e) => setForm({...form, name: e.target.value})} required />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label>Email</label>
            <input className="input-field" type="email" placeholder="example@gmail.com" onChange={(e) => setForm({...form, email: e.target.value})} required />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label>Mật khẩu</label>
            <input className="input-field" type="password" placeholder="••••••••" onChange={(e) => setForm({...form, password: e.target.value})} required minLength={6} />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label>Xác nhận mật khẩu</label>
            <input className="input-field" type="password" placeholder="••••••••" onChange={(e) => setConfirmPassword(e.target.value)} required />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label>Vai trò</label>
            <select className="input-field" value={form.role} onChange={(e) => setForm({...form, role: e.target.value})}>
              <option value="student">🎓 Sinh viên</option>
              <option value="teacher">👨‍🏫 Giáo viên</option>
              <option value="ta">🛡️ Trợ giảng (TA)</option>
            </select>
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }} type="submit">Tạo tài khoản</button>
        </form>
        <p style={{ marginTop: '15px', textAlign: 'center' }}>
          Đã có tài khoản? <Link to="/login" style={{ color: 'var(--primary)' }}>Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}
