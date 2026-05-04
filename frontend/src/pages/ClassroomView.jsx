import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AssignmentForm from './AssignmentForm';
import ExternalGradingTool from './ExternalGradingTool';

export default function ClassroomView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [classroom, setClassroom] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null); // Trạng thái lưu bài tập đang sửa
  const [showExternalTool, setShowExternalTool] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(null);
  const [grading, setGrading] = useState({});
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchClassroom();
  }, [id]);

  const fetchClassroom = async () => {
    try {
      const { data } = await axios.get(`/api/classrooms/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setClassroom(data);
    } catch (err) {
      alert('Không thể tải thông tin lớp học');
      navigate('/');
    }
  };

  const handleOpenExternal = (assId) => {
    setSelectedAssignmentId(assId);
    setShowExternalTool(true);
  };

  const handleEdit = (assignment) => {
    setEditingAssignment(assignment);
    setShowForm(true);
  };

  const handleGradeAll = async (assignmentId) => {
    setGrading(g => ({ ...g, [assignmentId]: true }));
    try {
      const res = await axios.post(`/api/submissions/grade-all/${assignmentId}`, {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      alert(res.data.message);
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi chấm bài');
    } finally {
      setGrading(g => ({ ...g, [assignmentId]: false }));
    }
  };

  if (!classroom) return <div className="container">Đang tải...</div>;

  const isTeacher = user.role === 'teacher';

  return (
    <div className="container" style={{ position: 'relative' }}>
      <button className="btn" onClick={() => navigate('/')} style={{ marginBottom: '20px' }}>← Quay lại danh sách lớp</button>
      
      {/* Modal Chấm bài External */}
      {showExternalTool && (
        <ExternalGradingTool 
          assignmentId={selectedAssignmentId} 
          onCancel={() => { setShowExternalTool(false); fetchClassroom(); }} 
        />
      )}

      <div className="card glass-morphism" style={{ marginBottom: '30px', padding: '25px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ margin: 0 }}>{classroom.name}</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>{classroom.description}</p>
          </div>
          {isTeacher && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ background: 'rgba(99,102,241,0.1)', padding: '10px 15px', borderRadius: '8px', border: '1px solid var(--primary)' }}>
                <span style={{ fontSize: '12px', color: 'var(--primary)', display: 'block' }}>Mã mời học viên: {classroom.inviteCode}</span>
                <strong style={{ fontSize: '20px', letterSpacing: '2px' }}>{classroom.inviteCode}</strong>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>📚 Bài tập của lớp</h2>
        {isTeacher && (
          <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); if(showForm) setEditingAssignment(null); }}>
            {showForm ? 'Hủy' : '+ Tạo Bài tập mới'}
          </button>
        )}
      </div>

      {showForm && isTeacher && (
        <div style={{ marginBottom: '30px' }}>
          <AssignmentForm
            classroomId={id}
            initialData={editingAssignment} // Truyền dữ liệu vào form nếu đang sửa
            onSuccess={() => { setShowForm(false); setEditingAssignment(null); fetchClassroom(); }}
            onCancel={() => { setShowForm(false); setEditingAssignment(null); }}
          />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        {classroom.assignments?.map(a => (
          <div key={a._id} className="card glass-morphism">
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ flex: 1 }}>{a.title}</h3>
                <div style={{ display: 'flex', gap: '5px' }}>
                   {isTeacher && (
                     <button 
                        className="btn" 
                        style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.05)', fontSize: '14px' }} 
                        onClick={() => handleEdit(a)}
                        title="Chỉnh sửa bài tập"
                     >
                       📝
                     </button>
                   )}
                   <span className="badge" style={{ fontSize: '10px', background: 'rgba(255,255,255,0.05)' }}>{a.type}</span>
                </div>
             </div>
             <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '10px 0' }}>{a.description?.substring(0, 100)}...</p>
             
             <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '15px' }}>
                <Link to={`/assignment/${a._id}`} className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', whiteSpace: 'nowrap' }}>Vào xem</Link>
                {isTeacher && (
                  <>
                    <button
                      className="btn btn-primary"
                      style={{ flex: 1, whiteSpace: 'nowrap' }}
                      disabled={grading[a._id]}
                      onClick={() => handleGradeAll(a._id)}
                    >
                      {grading[a._id] ? '⏳...' : '🤖 Chấm AI'}
                    </button>
                    <button 
                      className="btn" 
                      style={{ width: '100%', background: 'rgba(255,255,255,0.05)', fontSize: '13px' }}
                      onClick={() => handleOpenExternal(a._id)}
                    >
                      🧪 Chấm bài External (Sheets)
                    </button>
                  </>
                )}
             </div>
          </div>
        ))}
        {(!classroom.assignments || classroom.assignments.length === 0) && (
          <p style={{ color: 'var(--text-muted)', gridColumn: '1/-1', textAlign: 'center', padding: '40px' }}>Chưa có bài tập nào trong lớp này.</p>
        )}
      </div>

      {isTeacher && (
        <>
          <h2 style={{ marginBottom: '20px' }}>👥 Danh sách Học viên ({classroom.students?.length || 0})</h2>
          <div className="card glass-morphism">
             <table style={{ width: '100%', borderCollapse: 'collapse' }}>
               <thead>
                 <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                    <th style={{ padding: '10px' }}>Tên</th>
                    <th style={{ padding: '10px' }}>Email</th>
                 </tr>
               </thead>
               <tbody>
                 {classroom.students?.map(s => (
                   <tr key={s._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '10px' }}>{s.name}</td>
                      <td style={{ padding: '10px' }}>{s.email}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
        </>
      )}
    </div>
  );
}
