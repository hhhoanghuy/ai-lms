const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createSubmission,
  gradeAllSubmissions,
  gradeOneSubmission,
  getSubmissionsForAssignment,
  getMySubmissionForAssignment,
  reviewSubmission,
  getMyAllSubmissions,
  requestReview,
  createExternalSubmission,
  deleteSubmission
} = require('../controllers/submissionController');

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * QUY ĐỊNH ROUTE - SENIOR STANDARD
 * ─────────────────────────────────────────────────────────────────────────────
 */

// [Học viên] Nộp bài
router.post('/', protect, authorize('student'), createSubmission);

// [Học viên] Xem bài nộp của bản thân theo ID bài tập
router.get('/my-submission/:assignmentId', protect, authorize('student'), getMySubmissionForAssignment);

// [Học viên] Xem toàn bộ lịch sử nộp bài của bản thân
router.get('/my-all', protect, authorize('student'), getMyAllSubmissions);

// [Học viên] Yêu cầu phúc khảo
router.post('/request-review/:id', protect, authorize('student'), requestReview);

// ──────────────────────────────────────────────────────────────────────────────

// [Giáo viên/TA] Lấy danh sách bài nộp của 1 bài tập
router.get('/assignment/:assignmentId', protect, authorize('teacher', 'ta'), getSubmissionsForAssignment);

// [Giáo viên/TA] Chấm điểm HÀNG LOẠT bằng AI (Fix lỗi 404)
router.post('/grade-all/:assignmentId', protect, authorize('teacher', 'ta'), gradeAllSubmissions);

// [Giáo viên/TA] Chấm điểm LẺ cho 1 bài bằng AI
router.post('/grade-one/:id', protect, authorize('teacher', 'ta'), gradeOneSubmission);

// [Giáo viên/TA] Chấm điểm bài ngoài lớp
router.post('/external', protect, authorize('teacher', 'ta'), createExternalSubmission);

// [Giáo viên/TA] Lưu đánh giá thủ công/Duyệt điểm
router.put('/review/:id', protect, authorize('teacher', 'ta'), reviewSubmission);

// [Giáo viên/TA] Xóa bài nộp
router.delete('/:id', protect, authorize('teacher', 'ta'), deleteSubmission);

module.exports = router;
