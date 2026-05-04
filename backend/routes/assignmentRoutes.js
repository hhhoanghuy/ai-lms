const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const {
  createAssignment,
  updateAssignment,
  getAssignments,
  getAssignmentById,
  parseAssignmentText,
  parseAssignmentPDF,
  deleteAssignment
} = require('../controllers/assignmentController');

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * QUY ĐỊNH ROUTE BÀI TẬP (ASSIGNMENTS)
 * ─────────────────────────────────────────────────────────────────────────────
 */

// [Giáo viên] Tạo bài tập
router.post('/', protect, authorize('teacher'), createAssignment);

// [Giáo viên] Cập nhật bài tập
router.put('/:id', protect, authorize('teacher'), updateAssignment);

// [Giáo viên] Xóa bài tập
router.delete('/:id', protect, authorize('teacher'), deleteAssignment);

// [Giáo viên] AI Phân tích đề bài từ Text
router.post('/parse-text', protect, authorize('teacher'), parseAssignmentText);

// [Giáo viên] AI Phân tích đề bài từ PDF
router.post('/parse-pdf', protect, authorize('teacher'), upload.single('pdf'), parseAssignmentPDF);

// ──────────────────────────────────────────────────────────────────────────────

// [Mọi người] Lấy danh sách toàn bộ bài tập (Thường dùng cho Classroom)
router.get('/', protect, getAssignments);

// [Mọi người] Lấy chi tiết một bài tập
router.get('/:id', protect, getAssignmentById);

module.exports = router;
