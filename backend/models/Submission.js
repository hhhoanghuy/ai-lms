const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional for external
  isExternal: { type: Boolean, default: false },
  externalStudentName: { type: String },
  externalClassName: { type: String },
  
  // Loại bài nộp: github hoặc gõ code trực tiếp
  submissionType: { type: String, enum: ['github', 'direct_code'], default: 'github' },
  githubUrl: { type: String }, // Có thể rỗng nếu nộp direct_code
  vercelUrl: { type: String }, // Link demo Vercel (cho bài HTML/CSS)
  figmaUrl: { type: String }, // Link thiết kế Figma (nếu có)
  screenshot: { type: String }, // Ảnh chụp màn hình Desktop
  mobileScreenshot: { type: String }, // Ảnh chụp màn hình Mobile
  computedStyles: { type: mongoose.Schema.Types.Mixed }, 
  interactionLog: [{ type: String }], // Log các bước AI đã thử nghiệm
  content: { type: String }, // Mã nguồn nộp trực tiếp

  status: {
    type: String,
    enum: ['draft', 'submitted', 'grading', 'ai_evaluated', 'instructor_reviewed', 'published'],
    default: 'submitted'
  },

  // Điểm ĐỀ XUẤT của AI (ẩn với sinh viên)
  aiSuggestedScore: { type: mongoose.Schema.Types.Mixed }, 
  aiSuggestedTotalScore: { type: Number, default: 0 },
  aiSuggestedFeedback: { type: String },
  issues: [{ type: String }],
  suggestions: [{ type: String }],

  // Điểm CHÍNH THỨC do GV quyết định (hiện với sinh viên khi status=published)
  finalScore: { type: mongoose.Schema.Types.Mixed }, 
  totalScore: { type: Number, default: 0 },
  feedback: { type: String }, // Nhận xét cuối cùng của GV
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Dấu vết người đã duyệt

  isLate: { type: Boolean, default: false },
  isUnderReview: { type: Boolean, default: false },
  
  history: [{
    submissionType: String,
    githubUrl: String,
    content: String,
    submittedAt: { type: Date, default: Date.now }
  }],
  
  testCaseResults: [{ type: mongoose.Schema.Types.Mixed }], // Lưu kết quả Judge0
  testSummary: { type: mongoose.Schema.Types.Mixed },

  gradedAt: { type: Date }, // Ngày GV chốt điểm
  aiEvaluatedAt: { type: Date } // Ngày AI chấm xong
}, { timestamps: true });

module.exports = mongoose.model('Submission', submissionSchema);
