import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function TeacherDashboard({ logout }) {
  const [classrooms, setClassrooms] = useState([]);
  const [showClassForm, setShowClassForm] = useState(false);
  const [newClass, setNewClass] = useState({ name: '', description: '' });
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

  const handleCreateClass = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/classrooms', newClass, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setNewClass({ name: '', description: '' });
      setShowClassForm(false);
      fetchClassrooms();
      alert('Tạo lớp học thành công!');
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể tạo lớp học');
    }
  };

  return (
    <div className="container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <h1>🏫 Quản lý Lớp học</h1>
        <div>
          <button className="btn btn-primary" onClick={() => setShowClassForm(true)}>+ Tạo Lớp mới</button>
          <button className="btn btn-danger" style={{ marginLeft: '10px' }} onClick={logout}>Đăng xuất</button>
        </div>
      </header>

      {showClassForm && (
        <div className="card glass-morphism" style={{ marginBottom: '30px' }}>
          <form onSubmit={handleCreateClass}>
            <h3>Tạo Lớp học mới</h3>
            <input 
              className="input-field" 
              placeholder="Tên lớp học (VD: ReactJS Basic 01)" 
              value={newClass.name}
              onChange={e => setNewClass({...newClass, name: e.target.value})}
              required
              style={{ marginBottom: '10px' }}
            />
            <textarea 
              className="input-field" 
              placeholder="Mô tả ngắn về lớp học..." 
              value={newClass.description}
              onChange={e => setNewClass({...newClass, description: e.target.value})}
              style={{ marginBottom: '10px', height: '80px' }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn btn-primary">Xác nhận Tạo</button>
              <button type="button" className="btn" onClick={() => setShowClassForm(false)}>Hủy</button>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '15px' }}>
              <span>👥 {c.students?.length || 0} Học viên</span>
              <span>📚 {c.assignments?.length || 0} Bài tập</span>
            </div>
            <Link to={`/classroom/${c._id}`} className="btn btn-primary" style={{ display: 'block', textAlign: 'center' }}>Vào Lớp học</Link>
          </div>
        ))}
        {classrooms.length === 0 && !showClassForm && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
             Bạn chưa có lớp học nào. Hãy nhấn "Tạo Lớp mới" để bắt đầu giảng dạy!
          </div>
        )}
      </div>
    </div>
  );
}
