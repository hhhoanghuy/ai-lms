const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  
  // Loại bài tập
  type: { 
    type: String, 
    enum: ['javascript', 'html-css', 'general'], 
    default: 'general' 
  },

  // Mô tả (hỗ trợ Markdown)
  description: { type: String, required: true },

  // Yêu cầu bài tập (list)
  requirements: [{ type: String }],

  // Gợi ý (hints) — dạng Markdown
  hints: [{ type: String }],
  
  // Đáp án mẫu (chỉ dành cho giảng viên/AI xem)
  solutionCode: { type: String },
  
  // Code mẫu khởi đầu cho sinh viên
  templateCode: { type: String },
  
  // Link demo mẫu của giảng viên (để AI đối chiếu giao diện chuẩn)
  solutionVercelUrl: { type: String },

  // Test cases — dùng cho bài JavaScript (chạy qua Judge0)
  testCases: [{
    input: { type: String },
    expectedOutput: { type: String },
    isHidden: { type: Boolean, default: false } // Test case ẩn không hiện cho sinh viên
  }],

  // Ngôn ngữ lập trình (cho Judge0)
  languageId: { type: Number, default: 63 }, // 63 = JavaScript (Node.js)

  // Đính kèm ảnh / link Figma (cho bài HTML/CSS)
  attachments: [{ type: String }], // danh sách URL
  figmaUrl: { type: String }, // Link Figma thiết kế mẫu
  sampleFeedback: { type: String }, // Lời chấm mẫu & Lưu ý của giảng viên


  // Tech stack
  techStack: { type: String },

  // Hạn chót
  deadline: { type: Date, required: true },

  // Tiêu chí chấm bài
  rubric: [{
    criteria: String,
    description: String,
    maxScore: Number
  }],

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  classroom: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', required: true },
  status: { type: String, enum: ['published', 'draft'], default: 'published' }
}, { timestamps: true });

module.exports = mongoose.model('Assignment', assignmentSchema);
