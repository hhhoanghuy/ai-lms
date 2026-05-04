require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const CANDIDATES = [
  // Gemini 2.5
  'gemini-2.5-flash',
  'gemini-2.5-flash-preview',
  'gemini-2.5-flash-preview-04-17',
  'gemini-2.5-flash-exp-0325',
  'gemini-2.5-flash-latest',
  'gemini-2.5-pro',
  'gemini-2.5-pro-preview',
  'gemini-2.5-pro-exp-03-25',
  // Gemini 2.0
  'gemini-2.0-flash',
  'gemini-2.0-flash-latest',
  'gemini-2.0-flash-exp',
  // Gemini 1.5
  'gemini-1.5-flash',
  'gemini-1.5-flash-latest',
  'gemini-1.5-flash-8b',
];

async function checkModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  console.log('\n--- KIỂM TRA TÊN MODEL HỢP LỆ ---\n');
  const working = [];
  for (const m of CANDIDATES) {
    try {
      const model = genAI.getGenerativeModel({ model: m });
      await model.generateContent('Say OK in 1 word');
      console.log(`✅ [DÙNG ĐƯỢC] ${m}`);
      working.push(m);
    } catch (e) {
      const code = e.status || (e.message.includes('429') ? 429 : e.message.includes('404') ? 404 : '?');
      const reason = code === 429 ? 'HẾT QUOTA' : code === 404 ? 'KHÔNG TỒN TẠI' : e.message.substring(0, 60);
      console.log(`❌ [${code}] ${m.padEnd(40)} ${reason}`);
    }
  }
  console.log('\n=== KẾT QUẢ ===');
  if (working.length > 0) {
    console.log('Dùng được:', working);
  } else {
    console.log('⚠️ Không model nào hoạt động (có thể tất cả đang hết quota 429)');
    console.log('   Thử lại sau khi quota reset (~14:00 VN mỗi ngày)');
  }
}

checkModels().catch(console.error);
