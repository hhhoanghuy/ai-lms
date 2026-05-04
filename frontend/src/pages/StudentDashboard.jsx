import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function StudentDashboard({ logout }) {
  const [classrooms, setClassrooms] = useState([]);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const fetchClassrooms = async () => {
    try {
      const { data } = await axios.get('/api/classrooms/my-classrooms', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setClassrooms(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleJoinClass = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/classrooms/join', { inviteCode }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setInviteCode('');
      setShowJoinModal(false);
      fetchClassrooms();
      alert('Đã tham gia lớp học thành công!');
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể tham gia lớp học');
    }
  };

  return (
    <div className="container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <h1>🎓 Lớp học của tôi</h1>
        <div>
          <button className="btn btn-primary" onClick={() => setShowJoinModal(true)}>+ Tham gia Lớp bằng Mã</button>
          <button className="btn btn-danger" style={{ marginLeft: '10px' }} onClick={logout}>Đăng xuất</button>
        </div>
      </header>

      {showJoinModal && (
        <div className="card glass-morphism" style={{ marginBottom: '30px' }}>
          <form onSubmit={handleJoinClass}>
            <h3>Tham gia Lớp học</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '15px' }}>Nhập mã mời do Giáo viên của bạn cung cấp.</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input 
                className="input-field" 
                placeholder="Ví dụ: A1B2C3" 
                value={inviteCode}
                onChange={e => setInviteCode(e.target.value.toUpperCase())}
                required
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn btn-primary">Xác nhận</button>
              <button type="button" className="btn" onClick={() => setShowJoinModal(false)}>Hủy</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {classrooms.map(c => (
          <div key={c._id} className="card glass-morphism">
            <h3 style={{ margin: '0 0 10px 0' }}>{c.name}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '15px', height: '40px', overflow: 'hidden' }}>
              {c.description || 'Không có mô tả.'}
            </p>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '15px' }}>
              <span>👨‍🏫 GV: {c.teacher?.name}</span>
              <span>📚 {c.assignments?.length || 0} Bài tập</span>
            </div>
            <Link to={`/classroom/${c._id}`} className="btn btn-primary" style={{ display: 'block', textAlign: 'center' }}>Vào học</Link>
          </div>
        ))}
        {classrooms.length === 0 && !showJoinModal && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
             Bạn chưa tham gia lớp học nào. Hãy nhấn "Tham gia Lớp bằng Mã" để bắt đầu học tập!
          </div>
        )}
      </div>
    </div>
  );
}
