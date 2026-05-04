import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function ExternalGradingTool({ assignmentId, onCancel, onSuccess }) {
  const navigate = useNavigate();
  const [rows, setRows] = useState([{ id: Date.now(), name: '', className: '', githubUrl: '', vercelUrl: '', status: 'idle', result: null }]);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkData, setBulkData] = useState('');
  const user = JSON.parse(localStorage.getItem('user'));

  const addRow = () => setRows([...rows, { id: Date.now(), name: '', className: '', githubUrl: '', vercelUrl: '', status: 'idle', result: null }]);
  const removeRow = (id) => setRows(rows.filter(r => r.id !== id));

  const updateRow = (id, field, value) => {
    setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleBulkParse = () => {
    const lines = bulkData.split(/\r?\n/).filter(l => l.trim());
    const newRows = lines.map(line => {
      // Tách theo Tab, Gạch đứng (|) hoặc ít nhất 2 dấu cách liên tiếp
      const parts = line.split(/\t|\|| {2,}/).map(p => p.trim());
      return {
        id: Math.random(),
        name: parts[0] || '',
        className: parts[1] || '',
        githubUrl: parts[2] || '',
        figmaUrl: parts[3] || '',
        vercelUrl: parts[4] || '',
        status: 'idle',
        result: null
      };
    });
    setRows([...rows.filter(r => r.name || r.githubUrl), ...newRows]);
    setIsBulkMode(false);
  };

  const gradeRow = async (row) => {
    if (!row.githubUrl || !row.name || !row.figmaUrl || !row.vercelUrl) {
      alert('Vui lòng điền ĐẦY ĐỦ: Tên, Lớp, GitHub, Figma và Vercel!');
      return;
    }
    
    updateRow(row.id, 'status', 'grading');
    try {
      const { data } = await axios.post('/api/submissions/external', {
        assignmentId,
        externalStudentName: row.name,
        externalClassName: row.className,
        githubUrl: row.githubUrl,
        figmaUrl: row.figmaUrl,
        vercelUrl: row.vercelUrl
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      updateRow(row.id, 'status', 'success');
      updateRow(row.id, 'result', data.submission);
    } catch (err) {
      updateRow(row.id, 'status', 'error');
      alert(`Lỗi cho ${row.name}: ` + (err.response?.data?.message || err.message));
    }
  };

  const gradeAll = async () => {
     for (const row of rows) {
       if (row.status === 'idle' || row.status === 'error') {
         await gradeRow(row);
       }
     }
  };

  const handleOpenReview = (submission) => {
    if (!submission?._id) return;
    navigate(`/assignment/${assignmentId}/review/${submission._id}`);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.85)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }}>
      <div style={{ background: '#0f172a', width: '100%', maxWidth: '1200px', maxHeight: '90vh', borderRadius: '16px', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        <div style={{ padding: '20px 30px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>🛠️ Công cụ Chấm bài External</h2>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ padding: '20px 30px', borderBottom: '1px solid #1e293b', display: 'flex', gap: '15px' }}>
          <button className="btn btn-secondary" onClick={() => setIsBulkMode(!isBulkMode)}>
            {isBulkMode ? '⬅️ Quay lại' : '📋 Dán danh sách (Google Sheets)'}
          </button>
          {!isBulkMode && (
             <button className="btn btn-primary" onClick={gradeAll}>
               🚀 Bắt đầu Chấm tất cả AI
             </button>
          )}
        </div>

        <div style={{ padding: '30px', overflowY: 'auto', flex: 1 }}>
          {isBulkMode ? (
            <div>
                <textarea 
                  className="input-field" 
                  style={{ height: '300px' }} 
                  placeholder="Dán dữ liệu từ Google Sheets theo đúng thứ tự 5 cột:&#10;Tên Học Viên [Tab] Tên Lớp [Tab] Link GitHub [Tab] Link Figma [Tab] Link Vercel&#10;&#10;Lưu ý: TẤT CẢ CÁC LINK ĐỀU LÀ BẮT BUỘC."
                  value={bulkData}
                  onChange={e => setBulkData(e.target.value)}
                />
              <button className="btn btn-primary" style={{ marginTop: '20px' }} onClick={handleBulkParse}>Xử lý dữ liệu</button>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#64748b', fontSize: '12px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '10px' }}>Sinh viên</th>
                  <th style={{ padding: '10px' }}>Lớp</th>
                  <th style={{ padding: '10px' }}>GitHub</th>
                  <th style={{ padding: '10px' }}>Figma</th>
                  <th style={{ padding: '10px' }}>Vercel</th>
                  <th style={{ padding: '10px' }}>Trạng thái</th>
                  <th style={{ padding: '10px' }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr key={row.id} style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '10px' }}><input className="input-field" value={row.name} onChange={e => updateRow(row.id, 'name', e.target.value)} placeholder="Tên" /></td>
                    <td style={{ padding: '10px' }}><input className="input-field" value={row.className} onChange={e => updateRow(row.id, 'className', e.target.value)} placeholder="Lớp" /></td>
                    <td style={{ padding: '10px' }}><input className="input-field" value={row.githubUrl} onChange={e => updateRow(row.id, 'githubUrl', e.target.value)} placeholder="GitHub" /></td>
                    <td style={{ padding: '10px' }}><input className="input-field" value={row.figmaUrl} onChange={e => updateRow(row.id, 'figmaUrl', e.target.value)} placeholder="Figma" /></td>
                    <td style={{ padding: '10px' }}><input className="input-field" value={row.vercelUrl} onChange={e => updateRow(row.id, 'vercelUrl', e.target.value)} placeholder="Vercel" /></td>
                    <td style={{ padding: '10px' }}>
                      {row.status === 'idle' && <span>⚪ Chờ</span>}
                      {row.status === 'grading' && <span>⏳ Đang chấm...</span>}
                      {row.status === 'success' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: '#22c55e' }}>✅ {row.result?.aiSuggestedTotalScore ?? 0}/100</span>
                          {row.vercelUrl && <a href={row.vercelUrl} target="_blank" rel="noreferrer" title="Mở Demo" style={{ textDecoration: 'none' }}>🚀</a>}
                          {row.figmaUrl && <a href={row.figmaUrl} target="_blank" rel="noreferrer" title="Mở Figma" style={{ textDecoration: 'none' }}>🎨</a>}
                          {row.githubUrl && <a href={row.githubUrl} target="_blank" rel="noreferrer" title="Mở GitHub" style={{ textDecoration: 'none' }}>📁</a>}
                        </div>
                      )}
                      {row.status === 'error' && <span style={{ color: '#ef4444' }}>❌ Lỗi</span>}
                    </td>
                    <td style={{ padding: '10px' }}>
                      <button className="btn" onClick={() => gradeRow(row)} disabled={row.status === 'grading'}>Chấm AI</button>
                      {row.status === 'success' && <button className="btn" style={{ marginLeft: '5px' }} onClick={() => handleOpenReview(row.result)}>Rà soát</button>}
                      <button className="btn" style={{ marginLeft: '5px', background: '#ef4444' }} onClick={() => removeRow(row.id)}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div style={{ padding: '20px 30px', background: '#131c31', textAlign: 'right' }}>
           <button className="btn btn-primary" onClick={() => addRow()}>+ Thêm học viên mới</button>
           <button className="btn" style={{ marginLeft: '10px' }} onClick={onCancel}>Đóng Công cụ</button>
        </div>
      </div>
    </div>
  );
}
