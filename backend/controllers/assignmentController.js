const Assignment = require('../models/Assignment');
const Classroom = require('../models/Classroom');
const { callAI } = require('../services/aiClient');
const pdf = require('pdf-parse');

// Create Assignment
const createAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.create({ ...req.body, createdBy: req.user._id });
    
    // Link to Classroom
    await Classroom.findByIdAndUpdate(req.body.classroom, {
      $push: { assignments: assignment._id }
    });

    res.status(201).json(assignment);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// Update Assignment
const updateAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!assignment) return res.status(404).json({ message: 'Không tìm thấy bài tập để cập nhật' });
    res.json(assignment);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// Get All Assignments
const getAssignments = async (req, res) => {
  try {
    const { classroomId } = req.query;
    const filter = classroomId ? { classroom: classroomId } : {};
    const assignments = await Assignment.find(filter).sort({ createdAt: -1 });
    res.json(assignments);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// Get Assignment by ID
const getAssignmentById = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Không tìm thấy bài tập này' });
    res.json(assignment);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// AI Parse Text
const parseAssignmentText = async (req, res) => {
  const { rawText } = req.body;
  if (!rawText) return res.status(400).json({ message: 'Nội dung trống' });

  const prompt = `
Hãy đóng vai một chuyên gia giáo dục. Tôi sẽ cung cấp cho bạn nội dung đề bài. 
Nhiệm vụ của bạn là phân tích và trích xuất thông tin để tạo bài tập trên hệ thống LMS.

Nội dung: 
${rawText}

Hãy trả về một đối tượng JSON với cấu trúc sau (Tiếng Việt):
{
  "title": "Tiêu đề bài tập ngắn gọn",
  "type": "javascript" | "html-css" | "general",
  "description": "Mô tả chi tiết bài tập (dùng Markdown)",
  "requirements": ["Yêu cầu 1", "Yêu cầu 2", ...],
  "rubric": [
    {"criteria": "Tên tiêu chí", "maxScore": điểm_số},
    ...
  ],
  "sampleFeedback": "Một vài lời nhận xét mẫu phù hợp với bài tập này"
}

Lưu ý: 
- Phần rubric nên có tổng điểm các mục cộng lại bằng 100.
- Chỉ trả về duy nhất khối JSON, không kèm lời giải thích nào khác.
`;

  try {
    const responseText = await callAI(prompt);
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AI không trả về đúng định dạng JSON');
    res.json(JSON.parse(jsonMatch[0]));
  } catch (error) {
    res.status(500).json({ message: 'Lỗi AI: ' + error.message });
  }
};

const parseAssignmentPDF = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Không có file PDF được tải lên' });
    
    const data = await pdf(req.file.buffer);
    const rawText = data.text;
    
    if (!rawText || rawText.trim() === '') {
      return res.status(400).json({ message: 'PDF không chứa nội dung chữ hoặc không thể đọc' });
    }

    const prompt = `
Hãy đóng vai một chuyên gia giáo dục. Tôi sẽ cung cấp cho bạn nội dung đề bài được trích xuất từ file PDF. 
Nhiệm vụ của bạn là phân tích và trích xuất thông tin để tạo bài tập trên hệ thống LMS.

Nội dung: 
${rawText}

Hãy trả về một đối tượng JSON với cấu trúc sau (Tiếng Việt):
{
  "title": "Tiêu đề bài tập ngắn gọn",
  "type": "javascript" | "html-css" | "general",
  "description": "Mô tả chi tiết bài tập (dùng Markdown)",
  "requirements": ["Yêu cầu 1", "Yêu cầu 2", ...],
  "rubric": [
    {"criteria": "Tên tiêu chí", "maxScore": điểm_số},
    ...
  ],
  "sampleFeedback": "Một vài lời nhận xét mẫu phù hợp với bài tập này"
}

Lưu ý: 
- Phần rubric nên có tổng điểm các mục cộng lại bằng 100.
- Chỉ trả về duy nhất khối JSON, không kèm lời giải thích nào khác.
`;

    const responseText = await callAI(prompt);
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AI không trả về đúng định dạng JSON');
    res.json(JSON.parse(jsonMatch[0]));
  } catch (error) {
    res.status(500).json({ message: 'Lỗi xử lý PDF hoặc AI: ' + error.message });
  }
};

const deleteAssignment = async (req, res) => {
  try {
    await Assignment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Đã xóa bài tập' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = {
  createAssignment,
  updateAssignment,
  getAssignments,
  getAssignmentById,
  parseAssignmentText,
  parseAssignmentPDF,
  deleteAssignment
};
