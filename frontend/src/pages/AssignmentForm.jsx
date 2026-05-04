import { useState, useEffect } from 'react';
import axios from 'axios';

const LANGUAGE_OPTIONS = [
  { id: 63, name: 'JavaScript (Node.js)' },
  { id: 71, name: 'Python 3' },
  { id: 62, name: 'Java' },
  { id: 54, name: 'C++ (GCC)' },
  { id: 51, name: 'C#' },
];

const DEFAULT_RUBRIC = [
  { criteria: 'Chất lượng mã nguồn', maxScore: 30 },
  { criteria: 'Tính năng & Logic', maxScore: 40 },
  { criteria: 'Xử lý lỗi & Edge cases', maxScore: 30 },
];

export default function AssignmentForm({ onSuccess, onCancel, classroomId, initialData }) {
  const user = JSON.parse(localStorage.getItem('user'));
  const [form, setForm] = useState({
    title: '',
    type: 'javascript',
    description: '',
    requirements: [''],
    hints: [''],
    languageId: 63,
    testCases: [{ input: '', expectedOutput: '', isHidden: false }],
    attachments: [''],
    deadline: '',
    solutionCode: '',
    templateCode: '',
    figmaUrl: '',
    sampleFeedback: '',
    rubric: DEFAULT_RUBRIC,
  });

  const [showSmartImport, setShowSmartImport] = useState(false);
  const [rawText, setRawText] = useState('');
  const [isParsing, setIsParsing] = useState(false);

  useEffect(() => {
    if (initialData) {
      setForm({
        ...initialData,
        deadline: initialData.deadline ? new Date(initialData.deadline).toISOString().slice(0, 16) : '',
        requirements: initialData.requirements?.length ? initialData.requirements : [''],
        hints: initialData.hints?.length ? initialData.hints : [''],
        attachments: initialData.attachments?.length ? initialData.attachments : [''],
        testCases: initialData.testCases?.length ? initialData.testCases : [{ input: '', expectedOutput: '', isHidden: false }],
        rubric: initialData.rubric?.length ? initialData.rubric : DEFAULT_RUBRIC,
        sampleFeedback: initialData.sampleFeedback || '',
      });
    }
  }, [initialData]);

  const populateForm = (data) => {
    setForm(prev => ({
      ...prev,
      title: data.title || prev.title,
      type: data.type || prev.type,
      description: data.description || prev.description,
      requirements: data.requirements?.length ? data.requirements : prev.requirements,
      hints: data.hints?.length ? data.hints : prev.hints,
      rubric: data.rubric?.length ? data.rubric : prev.rubric,
      testCases: data.testCases?.length ? data.testCases : prev.testCases,
      templateCode: data.templateCode || prev.templateCode,
      solutionCode: data.solutionCode || prev.solutionCode,
      figmaUrl: data.figmaUrl || prev.figmaUrl,
      sampleFeedback: data.sampleFeedback || prev.sampleFeedback,
    }));
  };

  const handleSmartImport = async () => {
    if (!rawText.trim()) return;
    setIsParsing(true);
    try {
      const headers = { Authorization: `Bearer ${user.token}` };
      const { data } = await axios.post('/api/assignments/parse-text', { rawText }, { headers });
      populateForm(data);
      setShowSmartImport(false);
      setRawText('');
      alert('Đã nhập liệu thành công từ văn bản!');
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể phân tích văn bản này');
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileUpload = async (e) => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'application/pdf';
    fileInput.onchange = async (event) => {
      const file = event.target.files[0];
      if (!file) return;
      
      const formData = new FormData();
      formData.append('pdf', file);
      
      setIsParsing(true);
      try {
        const headers = { 
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'multipart/form-data'
        };
        const { data } = await axios.post('/api/assignments/parse-pdf', formData, { headers });
        populateForm(data);
        setShowSmartImport(false);
        alert('Đã nhập liệu thành công từ file PDF!');
      } catch (err) {
        alert(err.response?.data?.message || 'Không thể phân tích file PDF này');
      } finally {
        setIsParsing(false);
      }
    };
    fileInput.click();
  };

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const updateRubric = (i, field, value) => {
    const r = [...form.rubric];
    r[i] = { ...r[i], [field]: field === 'maxScore' ? Number(value) : value };
    set('rubric', r);
  };
  const addRubric = () => set('rubric', [...form.rubric, { criteria: '', maxScore: 10 }]);
  const removeRubric = (i) => set('rubric', form.rubric.filter((_, idx) => idx !== i));

  const updateList = (field, i, value) => {
    const arr = [...form[field]];
    arr[i] = value;
    set(field, arr);
  };
  const addListItem = (field) => set(field, [...form[field], '']);
  const removeListItem = (field, i) => set(field, form[field].filter((_, idx) => idx !== i));

  const updateTestCase = (i, field, value) => {
    const tc = [...form.testCases];
    tc[i] = { ...tc[i], [field]: value };
    set('testCases', tc);
  };
  const addTestCase = () => set('testCases', [...form.testCases, { input: '', expectedOutput: '', isHidden: false }]);
  const removeTestCase = (i) => set('testCases', form.testCases.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        classroom: classroomId,
        requirements: form.requirements.filter(r => r.trim()),
        hints: form.hints.filter(h => h.trim()),
        attachments: form.attachments.filter(a => a.trim()),
        testCases: form.type === 'javascript' ? form.testCases.filter(tc => tc.expectedOutput.trim()) : [],
      };
      
      const headers = { Authorization: `Bearer ${user.token}` };
      if (initialData) {
        await axios.put(`/api/assignments/${initialData._id}`, payload, { headers });
        alert('Cập nhật bài tập thành công!');
      } else {
        await axios.post('/api/assignments', payload, { headers });
        alert('Tạo bài tập mới thành công!');
      }
      onSuccess?.();
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const inputStyle = { marginBottom: '10px' };
  const sectionStyle = { background: 'rgba(0,0,0,0.15)', padding: '15px', borderRadius: '8px', marginBottom: '15px' };

  return (
    <div className="card glass-morphism">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>{initialData ? '📝 Chỉnh sửa Bài tập' : '📝 Tạo Bài tập Mới'}</h2>
        {!initialData && (
          <button 
            type="button" className="btn" 
            style={{ background: 'rgba(255,255,255,0.05)', fontSize: '13px' }}
            onClick={() => setShowSmartImport(true)}
          >✨ Nhập liệu nhanh bằng AI</button>
        )}
      </div>

      {showSmartImport && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{ background: '#1e293b', width: '100%', maxWidth: '800px', borderRadius: '12px', padding: '25px', position: 'relative' }}>
            <button onClick={() => setShowSmartImport(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '24px' }}>✕</button>
            
            <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8' }}>Dán đề bài (AI sẽ tự bóc tách):</label>
            <textarea className="input-field" style={{ height: '300px' }} placeholder="Dán đề bài hoặc văn bản yêu cầu..." value={rawText} onChange={e => setRawText(e.target.value)} />
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button className="btn btn-primary" onClick={handleSmartImport} disabled={isParsing || !rawText.trim()}>{isParsing ? '⏳ Đang phân tích...' : '✨ Phân tích văn bản'}</button>
              <button className="btn" onClick={() => setShowSmartImport(false)}>Đóng</button>
              <button className="btn" style={{ background: '#334155' }} onClick={handleFileUpload}>📄 Tải file PDF</button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <input className="input-field" style={inputStyle} placeholder="Tiêu đề bài tập *" value={form.title} onChange={e => set('title', e.target.value)} required />
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
          <select className="input-field" value={form.type} onChange={e => set('type', e.target.value)}>
            <option value="javascript">💻 JavaScript / Lập trình</option>
            <option value="html-css">🎨 HTML / CSS / UI</option>
            <option value="general">📋 Tổng quát</option>
          </select>
          <input className="input-field" type="datetime-local" value={form.deadline} onChange={e => set('deadline', e.target.value)} required />
        </div>

        <textarea className="input-field" style={{ ...inputStyle, height: '120px' }} placeholder="Mô tả bài tập (Markdown)... *" value={form.description} onChange={e => set('description', e.target.value)} required />

        <div style={sectionStyle}>
          <label style={{ fontWeight: 600, display: 'block' }}>📌 Yêu cầu bài tập</label>
          {form.requirements.map((r, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <input className="input-field" placeholder={`Yêu cầu ${i+1}`} value={r} onChange={e => updateList('requirements', i, e.target.value)} />
              {form.requirements.length > 1 && <button type="button" className="btn btn-danger" onClick={() => removeListItem('requirements', i)}>✕</button>}
            </div>
          ))}
          <button type="button" className="btn" style={{ marginTop: '8px' }} onClick={() => addListItem('requirements')}>+ Thêm yêu cầu</button>
        </div>

        <div style={sectionStyle}>
          <label style={{ fontWeight: 600 }}>📊 Tiêu chí chấm bài (Rubric)</label>
          {form.rubric.map((r, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 40px', gap: '8px', marginTop: '8px' }}>
              <input className="input-field" placeholder="Tên tiêu chí" value={r.criteria} onChange={e => updateRubric(i, 'criteria', e.target.value)} />
              <input className="input-field" type="number" value={r.maxScore} onChange={e => updateRubric(i, 'maxScore', e.target.value)} />
              {form.rubric.length > 1 && <button type="button" className="btn btn-danger" onClick={() => removeRubric(i)}>✕</button>}
            </div>
          ))}
          <button type="button" className="btn" style={{ marginTop: '8px' }} onClick={addRubric}>+ Thêm tiêu chí</button>
        </div>

        <div style={sectionStyle}>
          <label style={{ fontWeight: 600 }}>🛠️ Cấu hình hỗ trợ AI Chấm bài</label>
          <div style={{ marginTop: '10px' }}>
            <label style={{ fontSize: '13px', color: '#94a3b8' }}>Mã nguồn khởi đầu (Template cho SV):</label>
            <textarea className="input-field" style={{ height: '100px', fontFamily: 'monospace', fontSize: '12px' }} placeholder="Dán code khung (boiler plate) vào đây..." value={form.templateCode} onChange={e => set('templateCode', e.target.value)} />
          </div>
          <div style={{ marginTop: '10px' }}>
            <label style={{ fontSize: '13px', color: '#94a3b8' }}>Phong cách lời phê mẫu (Style hướng dẫn AI):</label>
            <textarea className="input-field" style={{ height: '80px', fontSize: '13px' }} placeholder="Ví dụ: 'Nhận xét cực kỳ khắt khe, tập trung vào kỹ thuật flexbox và đặt tên class...'" value={form.sampleFeedback} onChange={e => set('sampleFeedback', e.target.value)} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button className="btn btn-primary" type="submit" style={{ flex: 1 }}>{initialData ? '💾 Lưu thay đổi' : '🚀 Lưu bài tập'}</button>
          <button className="btn" type="button" onClick={onCancel}>Hủy</button>
        </div>
      </form>
    </div>
  );
}
