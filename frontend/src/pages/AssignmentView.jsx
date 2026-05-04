import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

export default function AssignmentView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  
  // Nộp bài sinh viên
  const [submission, setSubmission] = useState(null);
  const [submissionType, setSubmissionType] = useState('github');
  const [githubUrl, setGithubUrl] = useState('');
  const [figmaUrl, setFigmaUrl] = useState('');
  const [vercelUrl, setVercelUrl] = useState('');
  const [content, setContent] = useState('');
  
  // Giáo viên
  const [submissions, setSubmissions] = useState([]);
  
  const [showHints, setShowHints] = useState(false);
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const fetchData = async () => {
      const headers = { Authorization: `Bearer ${user.token}` };
      const resA = await axios.get(`/api/assignments/${id}`, { headers });
      setAssignment(resA.data);
      
      if (user.role === 'student') {
        const resS = await axios.get(`/api/submissions/my-submission/${id}`, { headers });
        if (resS.data) {
          setSubmission(resS.data);
          setSubmissionType(resS.data.submissionType || 'github');
          setGithubUrl(resS.data.githubUrl || '');
          setFigmaUrl(resS.data.figmaUrl || '');
          setVercelUrl(resS.data.vercelUrl || '');
          setContent(resS.data.content || '');
        }
      } else {
        // Teacher/TA fetch danh sách nộp bài
        const resS = await axios.get(`/api/submissions/assignment/${id}`, { headers });
        setSubmissions(resS.data);
      }
    };
    fetchData();
  }, [id, user.token, user.role]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/submissions', { 
        assignmentId: id, 
        submissionType, 
        githubUrl, 
        figmaUrl,
        vercelUrl,
        content 
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      alert('Nộp bài thành công!');
      // Fetch data instead of reloading
      const headers = { Authorization: `Bearer ${user.token}` };
      const resS = await axios.get(`/api/submissions/my-submission/${id}`, { headers });
      if (resS.data) {
        setSubmission(resS.data);
        setSubmissionType(resS.data.submissionType || 'github');
        setGithubUrl(resS.data.githubUrl || '');
        setVercelUrl(resS.data.vercelUrl || '');
        setContent(resS.data.content || '');
      }
    } catch (err) { alert(err.response?.data?.message || 'Nộp bài thất bại'); }
  };

  const handleReviewRequest = async () => {
    try {
      await axios.post(`/api/submissions/request-review/${submission._id}`, {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      alert('Đã gửi yêu cầu phúc khảo!');
      setSubmission({ ...submission, isUnderReview: true });
    } catch (err) { alert(err.response?.data?.message || 'Thất bại'); }
  };

  const handleGradeAll = async () => {
    try {
      if(!window.confirm('Chạy AI để phân tích và chấm điểm nháp cho toàn bộ bài nộp?')) return;
      await axios.post(`/api/submissions/grade-all/${id}`, {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      alert('Đã chạy AI hoàn tất!');
      const headers = { Authorization: `Bearer ${user.token}` };
      const resS = await axios.get(`/api/submissions/assignment/${id}`, { headers });
      setSubmissions(resS.data);
    } catch (err) { alert('Lỗi: ' + (err.response?.data?.message || err.message)); }
  };

  const handleGradeOne = async (subId) => {
    try {
      if(!window.confirm('Chạy AI chấm điểm lại cho riêng bài này?')) return;
      alert('Đang chạy AI (bao gồm chụp ảnh màn hình)... Vui lòng đợi trong giây lát.');
      const res = await axios.post(`/api/submissions/grade-one/${subId}`, {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      alert('Đã chấm AI xong!');
      // Update specific submission in state
      const updatedSub = res.data.submission;
      setSubmissions(submissions.map(s => s._id === subId ? { ...s, ...updatedSub } : s));
    } catch (err) { alert('Lỗi: ' + (err.response?.data?.message || err.message)); }
  };

  const handleDelete = async (subId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài nộp này? Hành động này không thể hoàn tác.')) return;
    try {
      await axios.delete(`/api/submissions/${subId}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      alert('Đã xóa bài nộp thành công!');
      setSubmissions(submissions.filter(s => s._id !== subId));
    } catch (err) { alert('Lỗi: ' + (err.response?.data?.message || err.message)); }
  };

  if (!assignment) return <div className="container">Đang tải...</div>;

  const statusMap = {
    submitted: { label: 'Đã nộp', color: 'var(--primary)' },
    grading: { label: 'Đang chấm', color: '#64748b' },
    ai_evaluated: { label: 'AI Đã chấm (Chờ duyệt)', color: '#f59e0b' },
    instructor_reviewed: { label: 'GV Đã duyệt', color: '#8b5cf6' },
    published: { label: 'Đã công bố điểm', color: '#22c55e' }
  };

  const typeLabel = { javascript: '💻 JavaScript', 'html-css': '🎨 HTML/CSS', general: '📋 Tổng quát' };

  return (
    <div className="container">
      <button className="btn" onClick={() => navigate('/')} style={{ marginBottom: '20px' }}>← Quay lại</button>

      {/* ── Thông tin bài tập ── */}
      <div className="card glass-morphism">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h1>{assignment.title}</h1>
          <span style={{ background: 'rgba(99,102,241,0.2)', color: 'var(--primary)', padding: '5px 12px', borderRadius: '6px', fontSize: '14px' }}>
            {typeLabel[assignment.type] || '📋'}
          </span>
        </div>
        <p style={{ marginTop: '12px', whiteSpace: 'pre-wrap', color: 'var(--text-muted)' }}>{assignment.description}</p>

        {/* ... (Phần hiển thị Ảnh, Yêu cầu, Test cases, Rubric, Hints giữ nguyên như cũ) */}
        {assignment.requirements?.length > 0 && (
          <div style={{ marginTop: '15px', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
            <strong>📌 Yêu cầu bài tập:</strong>
            <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
              {assignment.requirements.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>
        )}

        {assignment.figmaUrl && (
          <div style={{ marginTop: '15px', padding: '15px', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>🎨</span>
            <div style={{ flex: 1 }}>
              <strong style={{ display: 'block', color: 'var(--primary)', marginBottom: '4px' }}>Thiết kế mẫu (Figma)</strong>
              <a href={assignment.figmaUrl} target="_blank" rel="noreferrer" style={{ color: '#cbd5e1', fontSize: '13px', textDecoration: 'underline', wordBreak: 'break-all' }}>
                {assignment.figmaUrl}
              </a>
            </div>
            <a href={assignment.figmaUrl} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}>Mở Figma</a>
          </div>
        )}
      </div>

      {/* ── Phần Sinh viên nộp bài ── */}
      {user.role === 'student' && (
        <div className="card glass-morphism">
          <h2>Bài nộp của bạn</h2>
          <form onSubmit={handleSubmit} style={{ marginTop: '15px' }}>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ marginRight: '15px' }}>
                <input type="radio" checked={submissionType === 'github'} onChange={() => setSubmissionType('github')} /> Nộp link GitHub
              </label>
              <label>
                <input type="radio" checked={submissionType === 'direct_code'} onChange={() => setSubmissionType('direct_code')} /> Gõ code trực tiếp
              </label>
            </div>

            {assignment.templateCode && (
              <div style={{ marginBottom: '15px', background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px', border: '1px dashed #475569' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                   <span style={{ fontSize: '13px', color: '#94a3b8' }}>📋 Mã nguồn khởi đầu (Copy để bắt đầu làm bài)</span>
                   {(!submission || (!['instructor_reviewed', 'published'].includes(submission.status) && !submission.isUnderReview)) && (
                     <button type="button" className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '12px' }} 
                       onClick={() => { setSubmissionType('direct_code'); setContent(assignment.templateCode); }}>
                       Dùng Template này
                     </button>
                   )}
                </div>
                <pre style={{ margin: 0, fontSize: '12px', color: '#cbd5e1', overflowX: 'auto' }}>
                  <code>{assignment.templateCode}</code>
                </pre>
              </div>
            )}

            {submissionType === 'github' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input className="input-field" placeholder="Đường dẫn kho lưu trữ GitHub (https://github.com/...)"
                  value={githubUrl} onChange={e => setGithubUrl(e.target.value)}
                  required={submissionType === 'github'} disabled={submission && (['instructor_reviewed', 'published'].includes(submission.status) || submission.isUnderReview)} />
                
                <input className="input-field" placeholder="🎨 Link thiết kế Figma (BẮT BUỘC)"
                  value={figmaUrl} onChange={e => setFigmaUrl(e.target.value)}
                  required
                  disabled={submission && (['instructor_reviewed', 'published'].includes(submission.status) || submission.isUnderReview)} />

                <input className="input-field" placeholder="🚀 Link demo chạy thực tế (BẮT BUỘC để AI chấm giao diện)"
                  value={vercelUrl} onChange={e => setVercelUrl(e.target.value)}
                  required
                  disabled={submission && (['instructor_reviewed', 'published'].includes(submission.status) || submission.isUnderReview)} />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <textarea className="input-field" placeholder="Dán mã nguồn của bạn vào đây..."
                  style={{ height: '200px', fontFamily: 'monospace' }}
                  value={content} onChange={e => setContent(e.target.value)}
                  required={submissionType === 'direct_code'} disabled={submission && (['instructor_reviewed', 'published'].includes(submission.status) || submission.isUnderReview)} />
                
                <input className="input-field" placeholder="🎨 Link thiết kế Figma (BẮT BUỘC)"
                  value={figmaUrl} onChange={e => setFigmaUrl(e.target.value)}
                  required
                  disabled={submission && (['instructor_reviewed', 'published'].includes(submission.status) || submission.isUnderReview)} />

                <input className="input-field" placeholder="🚀 Link demo chạy thực tế (BẮT BUỘC để AI chấm giao diện)"
                  value={vercelUrl} onChange={e => setVercelUrl(e.target.value)}
                  required
                  disabled={submission && (['instructor_reviewed', 'published'].includes(submission.status) || submission.isUnderReview)} />
              </div>
            )}

            {(!submission || (!['instructor_reviewed', 'published'].includes(submission.status) && !submission.isUnderReview)) && (
              <button className="btn btn-primary" style={{ marginTop: '12px' }} type="submit">
                {submission ? '🔄 Cập nhật bài nộp' : '📤 Nộp bài'}
              </button>
            )}
          </form>

          {submission && (
            <div style={{ marginTop: '25px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
              <div style={{ marginBottom: '15px' }}>
                <span style={{ fontWeight: 600 }}>Trạng thái: </span>
                <span style={{ color: submission.isUnderReview ? '#ef4444' : (statusMap[submission.status]?.color || 'white'), fontWeight: 600 }}>
                  {submission.isUnderReview ? 'Đang phúc khảo' : (statusMap[submission.status]?.label || submission.status)}
                </span>
                {['submitted', 'ai_evaluated'].includes(submission.status) && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '5px' }}>
                    ⏳ Đang chờ giáo viên chấm & công bố điểm...
                  </p>
                )}
              </div>

              {/* Chỉ hiện kết quả khi đã được publish */}
              {submission.status === 'published' && (
                <div style={{ marginTop: '20px', background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
                  <h3 style={{ color: 'var(--secondary)', marginBottom: '15px', borderBottom: '1px solid #334155', paddingBottom: '10px' }}>
                    🎯 Kết quả chấm bài
                  </h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                    {assignment.rubric.map((r, i) => {
                       const scoreObj = (submission.finalScore || {})[r.criteria];
                       const obtainedScore = (typeof scoreObj === 'object' && scoreObj !== null) ? scoreObj.score : (scoreObj || 0);

                       return (
                         <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                           <span style={{ color: '#cbd5e1' }}>{r.criteria}</span>
                           <strong style={{ color: obtainedScore >= r.maxScore ? '#22c55e' : (obtainedScore > 0 ? '#f59e0b' : '#ef4444') }}>
                             {obtainedScore} <span style={{ color: '#64748b', fontSize: '13px' }}>/ {r.maxScore}</span>
                           </strong>
                         </div>
                       );
                    })}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h4 style={{ margin: 0 }}>Tổng điểm:</h4>
                    <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#22c55e' }}>{submission.totalScore}</span>
                  </div>

                  <div style={{ background: 'rgba(34, 197, 94, 0.1)', borderLeft: '4px solid #22c55e', padding: '15px', borderRadius: '4px', marginBottom: '20px' }}>
                    <strong style={{ display: 'block', marginBottom: '5px', color: '#22c55e' }}>💬 Lời phê của Giảng viên:</strong>
                    <p style={{ margin: 0, fontStyle: 'italic', color: '#e2e8f0', whiteSpace: 'pre-wrap' }}>"{submission.feedback}"</p>
                  </div>

                  <button className="btn btn-secondary" onClick={handleReviewRequest}>🔁 Yêu cầu Phúc khảo</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Phần Giáo viên quản lý (Queue & Stats) ── */}
      {['teacher', 'ta'].includes(user.role) && (
        <div className="card glass-morphism">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h2>Danh sách nộp bài ({submissions.length})</h2>
            <button className="btn btn-primary" onClick={handleGradeAll}>🤖 Chạy AI Chấm bài Tự động</button>
          </div>

          {/* Mini Dashboard */}
          <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '8px', flex: 1, textAlign: 'center' }}>
              <h3 style={{ margin: 0 }}>{submissions.length}</h3>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>Đã nộp</p>
            </div>
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '15px', borderRadius: '8px', flex: 1, textAlign: 'center' }}>
              <h3 style={{ margin: 0, color: '#f59e0b' }}>{submissions.filter(s => s.status === 'ai_evaluated').length}</h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#f59e0b' }}>Cần duyệt (AI đã chấm)</p>
            </div>
            <div style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '15px', borderRadius: '8px', flex: 1, textAlign: 'center' }}>
              <h3 style={{ margin: 0, color: '#22c55e' }}>{submissions.filter(s => s.status === 'published').length}</h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#22c55e' }}>Đã công bố</p>
            </div>
          </div>

          {/* Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                <th style={{ padding: '10px' }}>Sinh viên</th>
                <th style={{ padding: '10px' }}>Trạng thái</th>
                <th style={{ padding: '10px' }}>Điểm AI</th>
                <th style={{ padding: '10px' }}>Điểm Cuối</th>
                <th style={{ padding: '10px' }}>GitHub</th>
                <th style={{ padding: '10px' }}>Figma</th>
                <th style={{ padding: '10px' }}>Demo</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map(sub => (
                <tr key={sub._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '10px' }}>
                    <strong>{sub.student?.name || sub.externalStudentName || 'N/A'}</strong>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{sub.student?.email || (sub.isExternal ? `Học viên ngoài - ${sub.externalClassName || 'K.Rõ Lớp'}` : 'Chưa nhập Email')}</div>
                  </td>
                  <td style={{ padding: '10px' }}>
                    <span style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', color: sub.isUnderReview ? '#ef4444' : (statusMap[sub.status]?.color || 'white') }}>
                      {sub.isUnderReview ? 'Đang phúc khảo' : (statusMap[sub.status]?.label || sub.status)}
                    </span>
                  </td>
                  <td style={{ padding: '10px' }}>{sub.aiSuggestedTotalScore != null ? sub.aiSuggestedTotalScore : '-'}</td>
                  <td style={{ padding: '10px', fontWeight: 600, color: '#22c55e' }}>{sub.totalScore || '-'}</td>
                  <td style={{ padding: '10px' }}>
                    {sub.githubUrl ? (
                      <a href={sub.githubUrl} target="_blank" rel="noreferrer" title={sub.githubUrl} style={{ textDecoration: 'none', fontSize: '18px' }}>📁</a>
                    ) : '-'}
                  </td>
                  <td style={{ padding: '10px' }}>
                    {sub.figmaUrl ? (
                      <a href={sub.figmaUrl} target="_blank" rel="noreferrer" title={sub.figmaUrl} style={{ textDecoration: 'none', fontSize: '18px' }}>🎨</a>
                    ) : '-'}
                  </td>
                  <td style={{ padding: '10px' }}>
                    {sub.vercelUrl ? (
                      <a href={sub.vercelUrl} target="_blank" rel="noreferrer" title={sub.vercelUrl} style={{ textDecoration: 'none', fontSize: '18px' }}>🚀</a>
                    ) : '-'}
                  </td>
                  <td style={{ padding: '10px', textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button className="btn" style={{ padding: '8px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', border: '1px solid rgba(99, 102, 241, 0.2)' }} 
                      onClick={() => handleGradeOne(sub._id)} title="Chạy AI chấm lại bài này">
                      🤖
                    </button>
                    <button className="btn btn-secondary" onClick={() => navigate(`/assignment/${id}/review/${sub._id}`)}>
                      {sub.status === 'published' ? 'Xem lại' : 'Soát bài'}
                    </button>
                    <button className="btn" style={{ padding: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }} 
                      onClick={() => handleDelete(sub._id)} title="Xóa bài nộp">
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
              {submissions.length === 0 && (
                <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>Chưa có sinh viên nào nộp bài.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
