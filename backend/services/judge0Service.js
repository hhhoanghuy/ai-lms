const axios = require('axios');

// Judge0 API — dùng bản public miễn phí
// Đăng ký tại: https://rapidapi.com/judge0-official/api/judge0-ce
const JUDGE0_URL = process.env.JUDGE0_URL || 'https://judge0-ce.p.rapidapi.com';
const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY || '';

/**
 * Chạy code thật trên Judge0 và so sánh với expected output.
 * @param {string} code - Mã nguồn của sinh viên
 * @param {number} languageId - ID ngôn ngữ (63 = Node.js, 71 = Python, 62 = Java)
 * @param {Array} testCases - [ { input, expectedOutput } ]
 * @returns {Object} Kết quả chạy thật
 */
const runCodeWithTestCases = async (code, languageId = 63, testCases = []) => {
  if (!JUDGE0_API_KEY) {
    console.warn('[Judge0] Chưa cấu hình API Key — bỏ qua bước chạy code thật.');
    return { ran: false, results: [] };
  }

  const results = [];

  for (const tc of testCases) {
    try {
      // Gửi submission lên Judge0
      const submitRes = await axios.post(
        `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`,
        {
          language_id: languageId,
          source_code: code,
          stdin: tc.input || '',
          expected_output: tc.expectedOutput || ''
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-RapidAPI-Key': JUDGE0_API_KEY,
            'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
          }
        }
      );

      const result = submitRes.data;
      const passed = result.status?.id === 3 && // 3 = Accepted
        result.stdout?.trim() === (tc.expectedOutput || '').trim();

      results.push({
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput: result.stdout?.trim() || '',
        stderr: result.stderr || result.compile_output || '',
        status: result.status?.description || 'Unknown',
        passed,
        executionTime: result.time,
        memoryUsed: result.memory
      });

    } catch (err) {
      console.error('[Judge0] System Error (Rate Limit / API Key):', err.message);
      // Thay vì chèn lỗi HTTP (403, 429) vào mảng kết quả làm AI bị "ảo giác" và báo lại sinh viên,
      // ta chủ động thoát ra, ngưng chạy Code thật và fallback 100% về chế độ AI chấm tĩnh.
      console.warn('[Judge0] Tạm ngưng chạy test case do cạn tài nguyên. Chuyển quyền 100% sang cho AI tự đọc code chấm.');
      return { ran: false, results: [] };
    }
  }

  const passedCount = results.filter(r => r.passed).length;

  return {
    ran: true,
    results,
    summary: {
      total: results.length,
      passed: passedCount,
      failed: results.length - passedCount,
      passRate: results.length > 0 ? Math.round((passedCount / results.length) * 100) : 0
    }
  };
};

module.exports = { runCodeWithTestCases };
