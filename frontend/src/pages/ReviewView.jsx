import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

export default function ReviewView() {
  const { id, submissionId } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);

  const [rubricScores, setRubricScores] = useState({});
  const [feedback, setFeedback] = useState('');
  const [vercelUrl, setVercelUrl] = useState('');
  const [isGrading, setIsGrading] = useState(false);

  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const fetchData = async () => {
      const headers = { Authorization: `Bearer ${user.token}` };
      const resA = await axios.get(`/api/assignments/${id}`, { headers });
      setAssignment(resA.data);

      const resS = await axios.get(`/api/submissions/assignment/${id}`, { headers });
      setSubmissions(resS.data);
    };
    fetchData();
  }, [id, user.token]);

  const currentIndex = submissions.findIndex(s => s._id === submissionId);
  const currentSubmission = submissions[currentIndex];

  useEffect(() => {
    if (currentSubmission && assignment) {
      let newRubricScores = {};
      if (['instructor_reviewed', 'published'].includes(currentSubmission.status)) {
        if (typeof currentSubmission.finalScore === 'object' && currentSubmission.finalScore !== null) {
          // Map cũ lưu value trực tiếp vào finalScore
          Object.keys(currentSubmission.finalScore || {}).forEach(k => {
            const val = currentSubmission.finalScore[k];
            newRubricScores[k] = (typeof val === 'object' && val !== null) ? val.score : (val || 0);
          });
        }
        setFeedback(currentSubmission.feedback || '');
      } else {
        const aiScoreObj = currentSubmission.aiSuggestedScore || {};
        const aiKeys = Object.keys(aiScoreObj);

        assignment.rubric.forEach(r => {
          // Khớp tên tiêu chí linh hoạt (bỏ qua hoa thường, dấu cách thừa)
          const matchedKey = aiKeys.find(k => k.trim().toLowerCase() === r.criteria.trim().toLowerCase());

          if (matchedKey) {
            const val = aiScoreObj[matchedKey];
            newRubricScores[r.criteria] = (typeof val === 'object' && val !== null) ? val.score : (val || 0);
          } else if (assignment.rubric.length === 1 && aiKeys.length === 1) {
            // NẾU LUÔN CHỈ CÓ 1 TIÊU CHÍ (VD: Tính tổng 100đ): Tự động gán luôn cho dù AI gõ sai chữ
            const val = aiScoreObj[aiKeys[0]];
            newRubricScores[r.criteria] = (typeof val === 'object' && val !== null) ? val.score : (val || 0);
          } else {
            // Trường hợp bó tay do AI chế tên quá khác
            newRubricScores[r.criteria] = 0;
          }
        });
        setFeedback(currentSubmission.aiSuggestedFeedback || '');
      }
      setVercelUrl(currentSubmission.vercelUrl || '');
      // Đảm bảo đủ các cột rubric
      assignment.rubric.forEach(r => {
        if (newRubricScores[r.criteria] == null) newRubricScores[r.criteria] = 0;
      });

      setRubricScores(newRubricScores);
    }
  }, [currentSubmission, assignment]);

  const handleScoreChange = (criteria, val, maxScore) => {
    let n = Number(val);
    if (n > maxScore) n = maxScore;
    if (n < 0) n = 0;
    setRubricScores(prev => ({ ...prev, [criteria]: n }));
  };

  const handlePublish = async (status) => {
    // Tính tổng
    const totalScore = Object.values(rubricScores).reduce((acc, curr) => acc + curr, 0);

    try {
      await axios.put(`/api/submissions/review/${submissionId}`, {
        finalScore: rubricScores,
        totalScore: totalScore,
        feedback,
        vercelUrl,
        status // 'instructor_reviewed' hoặc 'published'
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      alert(status === 'published' ? 'Đã công bố điểm cho sinh viên!' : 'Đã lưu đánh giá nháp!');
      window.location.reload();
    } catch (err) { alert(err.response?.data?.message || 'Lưu thất bại'); }
  };

  const handleReGrade = async (skipUI = false) => {
    if (!window.confirm(skipUI ? 'Bạn có chắc muốn chấm lại bài này (Chế độ CHỈ CODE)?' : 'Bạn có chắc muốn chấm lại bài này (Chế độ FULL)?')) return;

    setIsGrading(true);
    try {
      await axios.post(`/api/submissions/grade-one/${submissionId}`, { skipUI }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      alert('Đã gửi yêu cầu chấm lại thành công. Vui lòng đợi vài giây để hệ thống cập nhật!');
      window.location.reload();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi yêu cầu chấm lại');
    } finally {
      setIsGrading(false);
    }
  };

  if (!assignment || !currentSubmission) return <div className="container">Đang tải...</div>;

  const totalCalculatedScore = Object.values(rubricScores).reduce((acc, curr) => acc + curr, 0);
  const maxAssignmentScore = assignment.rubric.reduce((s, r) => s + r.maxScore, 0);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#0f172a' }}>

      {/* KHÔNG GIAN BÊN TRÁI: CODE & TEST CASES CHẠY THẬT (60%) */}
      <div style={{ flex: '6', borderRight: '1px solid #334155', display: 'flex', flexDirection: 'column' }}>

        {/* Header Trái */}
        <div style={{ padding: '15px 20px', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '13px' }} onClick={() => navigate(`/assignment/${id}`)}>
              ← Trở về Queue
            </button>
            <span style={{ marginLeft: '15px', color: '#94a3b8', fontSize: '14px' }}>
              🧑‍🎓 {currentSubmission.isExternal ? 'Học viên (External):' : 'Sinh viên:'} <strong style={{ color: 'white' }}>{currentSubmission.isExternal ? currentSubmission.externalStudentName : currentSubmission.student?.name}</strong>
              {currentSubmission.isExternal && currentSubmission.externalClassName && <span style={{ fontSize: '12px', marginLeft: '8px' }}>| Lớp: {currentSubmission.externalClassName}</span>}
              {!currentSubmission.isExternal && currentSubmission.student?.email && <span style={{ fontSize: '12px', marginLeft: '8px' }}>({currentSubmission.student.email})</span>}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary" disabled={currentIndex === 0} onClick={() => navigate(`/assignment/${id}/review/${submissions[currentIndex - 1]?._id}`)}>
              ← SV Trước
            </button>
            <span style={{ color: 'white', lineHeight: '36px', fontSize: '14px' }}>
              {currentIndex + 1} / {submissions.length}
            </span>
            <button className="btn btn-secondary" disabled={currentIndex === submissions.length - 1} onClick={() => navigate(`/assignment/${id}/review/${submissions[currentIndex + 1]?._id}`)}>
              SV Tiếp →
            </button>
          </div>
        </div>

        {/* Nội dung Trái (Scrollable) */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

          <div style={{ display: 'flex', gap: '20px', flexDirection: 'column' }}>
            {/* Cột mã nguồn */}
            <div style={{ flex: 1 }}>
              <h3 style={{ borderBottom: '1px solid #334155', paddingBottom: '10px' }}>📄 Mã nguồn Sinh viên</h3>
              {currentSubmission.submissionType === 'github' ? (
                <div style={{ background: '#1e293b', padding: '15px', borderRadius: '8px', border: '1px solid #334155', marginTop: '15px' }}>
                  <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px' }}>📦 Nộp qua GitHub:</p>
                  <a href={currentSubmission.githubUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '14px', wordBreak: 'break-all' }}>
                    🔗 {currentSubmission.githubUrl}
                  </a>
                </div>
              ) : (
                <div style={{ background: '#1e293b', padding: '15px', borderRadius: '8px', border: '1px solid #334155', marginTop: '15px' }}>
                  <p style={{ margin: '0 0 10px 0', color: '#94a3b8', fontSize: '13px' }}>✍️ Mã nguồn nộp trực tiếp:</p>
                  <pre style={{ margin: 0, overflowX: 'auto', maxHeight: '400px', fontSize: '13px', color: '#cbd5e1' }}>
                    <code>{currentSubmission.content || '(Trống)'}</code>
                  </pre>
                </div>
              )}

              {/* Chèn link Figma & Vercel */}
              {(assignment.figmaUrl || currentSubmission.vercelUrl) && (
                <div style={{ marginTop: '20px', background: 'rgba(99, 102, 241, 0.05)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.2)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>🎨</span> Kiểm tra giao diện (Visual Review)
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: (currentSubmission.figmaUrl || assignment.figmaUrl) && vercelUrl ? '1fr 1fr' : '1fr', gap: '10px' }}>
                    {(currentSubmission.figmaUrl || assignment.figmaUrl) && (
                      <a href={currentSubmission.figmaUrl || assignment.figmaUrl} target="_blank" rel="noreferrer" className="btn" style={{ background: '#0f172a', border: '1px solid #334155', color: '#e2e8f0', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textAlign: 'center' }}>
                        🎨 Mở Figma Thiết kế
                      </a>
                    )}
                    {vercelUrl && (
                      <a href={vercelUrl} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textAlign: 'center' }}>
                        🚀 Xem Vercel
                      </a>
                    )}
                  </div>

                  {/* Cho phép sửa Vercel URL */}
                  <div style={{ marginTop: '10px' }}>
                    <label style={{ fontSize: '13px', color: '#fff', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>🚀 LINK DEPLOY (Bắt buộc để AI soi giao diện):</label>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <input 
                        className="input-field" 
                        style={{ flex: 1, fontSize: '14px', padding: '10px', border: '1px solid var(--primary)', background: '#0f172a' }} 
                        placeholder="Dán link Vercel/Netlify của học viên vào đây..." 
                        value={vercelUrl} 
                        onChange={e => setVercelUrl(e.target.value)} 
                      />
                      <button className="btn btn-primary" style={{ padding: '0 20px', fontWeight: 'bold', background: '#8b5cf6' }} onClick={() => handleReGrade(false, vercelUrl)}>🤖 Lưu & Chấm AI NGAY</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Hiển thị Interaction Log */}
              {currentSubmission.interactionLog?.length > 0 && (
                <div style={{ marginTop: '20px', background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '8px', border: '1px solid #334155' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#94a3b8' }}>🕵️ Nhật ký kiểm thử AI:</h4>
                  <ul style={{ paddingLeft: '20px', margin: 0, fontSize: '13px', color: '#e2e8f0' }}>
                    {currentSubmission.interactionLog.map((log, i) => (
                      <li key={i} style={{ marginBottom: '5px' }}>{log}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Hiển thị Screenshot AI đã chụp */}
              {(currentSubmission.screenshot || currentSubmission.mobileScreenshot) && (
                <div style={{ marginTop: '20px' }}>
                  <h3 style={{ borderBottom: '1px solid #334155', paddingBottom: '10px', marginBottom: '15px' }}>📸 Bằng chứng Visual (Desktop & Mobile)</h3>

                  <div style={{ display: 'grid', gridTemplateColumns: currentSubmission.screenshot && currentSubmission.mobileScreenshot ? '1fr 1fr' : '1fr', gap: '15px' }}>
                    {currentSubmission.screenshot && (
                      <div>
                        <p style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', marginBottom: '8px' }}>🖥️ Desktop View</p>
                        <div style={{ border: '1px solid #334155', borderRadius: '8px', overflow: 'hidden', background: '#000' }}>
                          <img src={`data:image/png;base64,${currentSubmission.screenshot}`} alt="Desktop" style={{ width: '100%', height: 'auto' }} />
                        </div>
                      </div>
                    )}
                    {currentSubmission.mobileScreenshot && (
                      <div>
                        <p style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', marginBottom: '8px' }}>📱 Mobile View (375px)</p>
                        <div style={{ border: '1px solid #334155', borderRadius: '8px', overflow: 'hidden', background: '#000' }}>
                          <img src={`data:image/png;base64,${currentSubmission.mobileScreenshot}`} alt="Mobile" style={{ width: '100%', height: 'auto' }} />
                        </div>
                      </div>
                    )}
                  </div>

                  <p style={{ fontSize: '11px', color: '#64748b', marginTop: '12px', textAlign: 'center' }}>
                    Kiểm thử lúc {new Date(currentSubmission.aiEvaluatedAt).toLocaleString('vi-VN')}
                  </p>
                </div>
              )}
            </div>

            {/* Cột kết quả Test Case (nếu có) */}
            {currentSubmission.testSummary && (
              <div style={{ width: '100%' }}>
                <h3 style={{ borderBottom: '1px solid #334155', paddingBottom: '10px' }}>🧪 Judge0 Log</h3>
                <div style={{ background: '#1e293b', padding: '15px', borderRadius: '8px', marginTop: '15px' }}>
                  <div style={{ display: 'flex', gap: '20px', marginBottom: '10px' }}>
                    <span style={{ color: '#22c55e' }}>✅ Passed: {currentSubmission.testSummary.passed}</span>
                    <span style={{ color: '#ef4444' }}>❌ Failed: {currentSubmission.testSummary.failed}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {currentSubmission.testCaseResults?.map((r, i) => (
                      <div key={i} style={{
                        padding: '8px', borderRadius: '6px', fontSize: '12px', fontFamily: 'monospace',
                        background: r.passed ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                        border: `1px solid ${r.passed ? '#22c55e' : '#ef4444'}`
                      }}>
                        T/C {i + 1}: {r.passed ? 'PASS' : `FAIL ➝ Got: "${String(r.actualOutput || '').substring(0, 50)}" ${r.stderr ? '| Lỗi: ' + r.stderr : ''}`}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* KHÔNG GIAN BÊN PHẢI: CHẤM ĐIỂM (40%) */}
      <div style={{ flex: '4', display: 'flex', flexDirection: 'column', background: '#1e293b' }}>
        <div style={{ padding: '15px 20px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>{currentSubmission.status === 'published' ? '✅' : '📝'}</span>
            Rubric & Đánh giá
          </h2>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: totalCalculatedScore >= (maxAssignmentScore / 2) ? '#22c55e' : '#ef4444' }}>
            {totalCalculatedScore} <span style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 'normal' }}>/ {maxAssignmentScore}</span>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

          {/* Thông báo từ AI */}
          {currentSubmission.status === 'ai_evaluated' && (
            <div style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid var(--primary)', padding: '12px', borderRadius: '8px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '5px' }}>
                <span style={{ fontSize: '20px' }}>🤖</span>
                <strong style={{ color: 'var(--primary)' }}>AI đã phân tích mã nguồn!</strong>
              </div>
              <p style={{ fontSize: '13px', margin: 0, color: '#e2e8f0' }}>Vui lòng rà soát lại điểm và lý do của AI từng mục dưới đây trước khi chốt điểm chính thức.</p>

              {currentSubmission.issues?.length > 0 && (
                <div style={{ marginTop: '10px', fontSize: '12px', color: '#f87171' }}>
                  <strong>Cờ cảnh báo nguy hiểm:</strong>
                  <ul style={{ paddingLeft: '15px', margin: '5px 0' }}>{currentSubmission.issues.map((iss, i) => <li key={i}>{iss}</li>)}</ul>
                </div>
              )}
            </div>
          )}

          {/* Breakdown Điểm theo Rubric */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '15px', color: '#cbd5e1', marginBottom: '10px' }}>📊 Bảng Điểm Chi Tiết</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {assignment.rubric.map((r, i) => {
                const aiData = (currentSubmission.aiSuggestedScore || {})[r.criteria];
                const aiReason = (typeof aiData === 'object' && aiData !== null) ? aiData.reason : null;

                return (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px', border: '1px solid #334155' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <strong style={{ color: '#f8fafc', fontSize: '14px' }}>{r.criteria}</strong>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <input
                          type="number"
                          className="input-field"
                          style={{ width: '60px', padding: '4px 8px', textAlign: 'center', background: '#0f172a', border: '1px solid #64748b' }}
                          value={rubricScores[r.criteria] !== undefined ? rubricScores[r.criteria] : 0}
                          onChange={(e) => handleScoreChange(r.criteria, e.target.value, r.maxScore)}
                          max={r.maxScore} min={0}
                        />
                        <span style={{ fontSize: '13px', color: '#94a3b8' }}>/ {r.maxScore}</span>
                      </div>
                    </div>
                    {/* Li do của AI */}
                    {aiReason && (
                      <div style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic', background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '4px' }}>
                        <strong>🤖 Trợ lý phân tích:</strong> {aiReason}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Lời phê chung */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', color: '#f8fafc', fontWeight: 'bold', fontSize: '14px', marginBottom: '8px' }}>💬 Lời phê Tổng quan (Gửi học viên)</label>
            <textarea
              className="input-field"
              style={{ minHeight: '300px', fontSize: '14px', lineHeight: '1.6', resize: 'vertical' }}
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '5px' }}>
              <button
                className="btn"
                style={{ background: '#334155', color: 'white', fontSize: '13px', padding: '8px' }}
                onClick={() => handleReGrade(false)}
                disabled={isGrading}
              >
                {isGrading ? '⏳ Đang chấm...' : '🤖 AI Chấm lại (Full)'}
              </button>
              <button
                className="btn"
                style={{ background: '#475569', color: 'white', fontSize: '13px', padding: '8px' }}
                onClick={() => handleReGrade(true)}
                disabled={isGrading}
              >
                {isGrading ? '⏳ Đang chấm...' : '🤖 AI Chấm lại (Chỉ Code)'}
              </button>
            </div>

            <button className="btn" style={{ background: 'var(--primary)', color: 'white' }} onClick={() => handlePublish('published')}>
              📢 Bấm chốt & Công bố điểm cho Sinh viên
            </button>
            <button className="btn btn-secondary" onClick={() => handlePublish('instructor_reviewed')}>
              💾 Lưu nháp (chưa gửi học viên)
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}
