const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');
const { fetchCodeFromRepo } = require('../services/githubService');
const { gradeSubmission } = require('../services/aiGradingService');

/**
 * calculateCodeSimilarity: Thuật toán so sánh độ tương đồng mã nguồn (Senior Logic)
 */
const calculateCodeSimilarity = (code1 = '', code2 = '') => {
  if (!code1 || !code2) return 0;
  const normalize = (c) => c.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
  const c1 = normalize(code1);
  const c2 = normalize(code2);
  if (c1 === c2) return 100;
  const tokens1 = new Set(c1.split(/[\s{};,()]+/));
  const tokens2 = new Set(c2.split(/[\s{};,()]+/));
  const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
  const union = new Set([...tokens1, ...tokens2]);
  return (intersection.size / union.size) * 100;
};

/**
 * gradeAllSubmissions: Chấm song song 10 bài & Golden Reference Cache
 */
const gradeAllSubmissions = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) return res.status(404).json({ message: 'Không tìm thấy bài tập' });

    const submissions = await Submission.find({ 
      assignment: assignmentId, 
      status: { $in: ['submitted', 'ai_evaluated', 'graded', 'grading'] } 
    }).populate('student', 'name');

    console.log(`\n======================================================`);
    console.log(`🚀 [BATCH-GRADDING] Bắt đầu chấm song song 10 bài cho: ${assignment.title}`);
    console.log(`📡 Tổng học sinh: ${submissions.length} | Ngưỡng Golden Match: 92%`);
    console.log(`======================================================\n`);

    let goldenSubmissions = []; 

    const processSubmission = async (sub) => {
      // 🚨 QUAN TRỌNG: Khai báo tên SV ở NGOÀI khối try-catch để catch block có thể dùng được
      const studentName = sub.isExternal ? (sub.externalStudentName || 'External Student') : (sub.student?.name || 'HS trong lớp');
      
      try {
        sub.status = 'grading';
        await sub.save();

        let currentCode = sub.content || '';
        if (sub.submissionType === 'github' && sub.githubUrl) {
          try {
            currentCode = await fetchCodeFromRepo(sub.githubUrl, assignment.title);
          } catch (gitErr) {
            throw new Error(`[LỖI GITHUB] ${gitErr.message}`);
          }
        }

        let matchedGolden = null;
        for (const golden of goldenSubmissions) {
          const sim = calculateCodeSimilarity(currentCode, golden.code);
          if (sim >= 92) {
            matchedGolden = { ...golden, similarity: sim };
            break;
          }
        }

        let aiResult;
        if (matchedGolden) {
          console.log(`   └─ [GOLDEN-MATCH] SV ${studentName} giống ${matchedGolden.similarity.toFixed(1)}% bài chuẩn.`);
          aiResult = {
            ...matchedGolden.result,
            feedback: `[Tối ưu] Lời phê tương tự bài chuẩn: ${matchedGolden.result.feedback}`
          };
        } else {
          aiResult = await gradeSubmission(currentCode, assignment, sub);
          if (aiResult.total >= 10 && goldenSubmissions.length < 5) {
            goldenSubmissions.push({ code: currentCode, result: aiResult });
            console.log(`   └─ [NEW-GOLDEN] 🎉 SV ${studentName} trở thành Bài chuẩn.`);
          }
        }

        sub.aiSuggestedScore = aiResult.score;
        sub.aiSuggestedTotalScore = aiResult.total;
        sub.aiSuggestedFeedback = aiResult.feedback;
        sub.issues = aiResult.issues || [];
        sub.suggestions = aiResult.suggestions || [];
        sub.screenshot = aiResult.screenshot;
        sub.mobileScreenshot = aiResult.mobileScreenshot;
        sub.computedStyles = aiResult.computedStyles;
        sub.interactionLog = aiResult.interactionLog;
        sub.status = 'ai_evaluated';
        sub.aiEvaluatedAt = new Date();
        await sub.save();

        console.log(`   └─ [Xong] SV ${studentName} | Điểm: ${aiResult.total}`);
      } catch (err) {
        // Bây giờ studentName đã có giá trị chính xác
        console.error(`   └─ [XỬ LÝ LỖI] Ghi nhận bài lỗi cho SV ${studentName}:`, err.message);
        
        sub.aiSuggestedTotalScore = 0;
        sub.aiSuggestedFeedback = `🚨 LỖI HỆ THỐNG: ${err.message}`;
        sub.status = 'ai_evaluated'; 
        sub.aiEvaluatedAt = new Date();
        await sub.save();
      }
    };

    for (let i = 0; i < submissions.length; i += 10) {
      const batch = submissions.slice(i, i + 10);
      console.log(`\n💠 [Lượt ${Math.floor(i/10) + 1}] Đang xử lý nhóm 10 học sinh...`);
      await Promise.all(batch.map(s => processSubmission(s)));
    }

    console.log(`\n======================================================`);
    console.log(`🎉 [HOÀN TẤT] Đã xử lý xong ${submissions.length} bài (Bao gồm cả các bài lỗi).`);
    console.log(`======================================================\n`);

    res.json({ message: `Hoàn thành xử lý 10 bài song song cho ${submissions.length} SV.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const gradeOneSubmission = async (req, res) => {
  try {
    const submissionId = req.params.id;
    const submission = await Submission.findById(submissionId).populate('assignment').populate('student', 'name');
    if (!submission) return res.status(404).json({ message: 'Không tìm thấy bài nộp' });

    const studentName = submission.isExternal ? (submission.externalStudentName || 'External Student') : (submission.student?.name || 'HS trong lớp');
    console.log(`\n[Hệ thống] 🚀 Đang chấm điểm đơn cho SV: ${studentName}`);

    let code = submission.content || '';
    if (submission.submissionType === 'github' && submission.githubUrl) {
      code = await fetchCodeFromRepo(submission.githubUrl, submission.assignment.title);
    }

    const aiResult = await gradeSubmission(code, submission.assignment, submission);

    submission.aiSuggestedScore = aiResult.score;
    submission.aiSuggestedTotalScore = aiResult.total;
    submission.aiSuggestedFeedback = aiResult.feedback;
    submission.issues = aiResult.issues || [];
    submission.suggestions = aiResult.suggestions || [];
    submission.screenshot = aiResult.screenshot;
    submission.mobileScreenshot = aiResult.mobileScreenshot;
    submission.computedStyles = aiResult.computedStyles;
    submission.interactionLog = aiResult.interactionLog;
    submission.status = 'ai_evaluated';
    submission.aiEvaluatedAt = new Date();

    await submission.save();
    res.json({ message: 'Chấm điểm lại thành công!', submission });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createSubmission = async (req, res) => {
  try {
    const { assignmentId, submissionType, githubUrl, vercelUrl, content } = req.body;
    const assignment = await Assignment.findById(assignmentId);
    const isLate = new Date() > new Date(assignment.deadline);
    let submission = await Submission.findOne({ assignment: assignmentId, student: req.user._id });
    if (submission) {
      submission.submissionType = submissionType;
      submission.githubUrl = githubUrl;
      submission.vercelUrl = vercelUrl;
      submission.content = content;
      submission.status = 'submitted';
      await submission.save();
    } else {
      submission = await Submission.create({
        assignment: assignmentId, student: req.user._id, submissionType, githubUrl, vercelUrl, content, isLate
      });
    }
    res.status(201).json(submission);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const getSubmissionsForAssignment = async (req, res) => {
  try {
    const submissions = await Submission.find({ assignment: req.params.assignmentId }).populate('student', 'name email');
    res.json(submissions);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const getMySubmissionForAssignment = async (req, res) => {
  try {
    const submission = await Submission.findOne({ assignment: req.params.assignmentId, student: req.user._id });
    res.json(submission);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const reviewSubmission = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);
    const { vercelUrl, ...otherData } = req.body;
    Object.assign(submission, otherData);
    if (vercelUrl !== undefined) submission.vercelUrl = vercelUrl;
    submission.status = req.body.status || 'graded';
    submission.gradedAt = new Date();
    await submission.save();
    res.json({ message: 'Lưu đánh giá xong', submission });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const getMyAllSubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({ student: req.user._id });
    res.json(submissions);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const requestReview = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);
    submission.status = 'grading'; 
    await submission.save();
    res.json({ message: 'Đã gửi yêu cầu chấm lại!' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const deleteSubmission = async (req, res) => {
  try {
    await Submission.findByIdAndDelete(req.params.id);
    res.json({ message: 'Đã xóa' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const createExternalSubmission = async (req, res) => {
  try {
    const { assignmentId, githubUrl, vercelUrl, figmaUrl } = req.body;
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) return res.status(404).json({ message: 'Không tìm thấy bài tập' });

    const code = await fetchCodeFromRepo(githubUrl, assignment.title);
    const result = await gradeSubmission(code, assignment, { vercelUrl });
    
    const submission = await Submission.create({ 
      ...req.body, 
      assignment: assignmentId, 
      submissionType: 'github', 
      aiSuggestedScore: result.score, 
      aiSuggestedTotalScore: result.total,
      aiSuggestedFeedback: result.feedback,
      issues: result.issues || [],
      suggestions: result.suggestions || [],
      screenshot: result.screenshot,
      mobileScreenshot: result.mobileScreenshot,
      computedStyles: result.computedStyles,
      interactionLog: result.interactionLog,
      figmaUrl: figmaUrl,
      status: 'ai_evaluated',
      isExternal: true,
      aiEvaluatedAt: new Date()
    });
    res.status(201).json({ message: 'Chấm bài External thành công', submission });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = {
  createSubmission, gradeAllSubmissions, gradeOneSubmission, getSubmissionsForAssignment,
  getMySubmissionForAssignment, reviewSubmission, getMyAllSubmissions, requestReview, createExternalSubmission, deleteSubmission
};
