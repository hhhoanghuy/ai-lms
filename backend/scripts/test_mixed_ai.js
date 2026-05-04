require('dotenv').config();
const { callAI } = require('../services/aiClient');

async function test() {
  console.log("=== 🧪 TEST HỆ THỐNG AI TỐI ƯU HÓA ===");
  
  try {
    console.log("\n1. Kiểm tra GROQ (Cho bài chấm Logic/Text)...");
    const groqRes = await callAI("Say hello from Groq and tell me your model name.", { provider: 'groq' });
    console.log("-> Kết quả Groq:", groqRes);
  } catch (err) {
    console.error("-> ❌ Groq Thất bại:", err.message);
  }

  try {
    console.log("\n2. Kiểm tra GEMINI (Cho bài chấm Vision/HTML)...");
    const geminiRes = await callAI("Say hello from Gemini.", { provider: 'gemini' });
    console.log("-> Kết quả Gemini:", geminiRes);
  } catch (err) {
    console.error("-> ❌ Gemini Thất bại:", err.message);
  }

  try {
    console.log("\n3. Kiểm tra Tự động (Không Vision -> Groq)...");
    const autoRes = await callAI("Testing auto provider detection.", { provider: 'auto' });
    console.log("-> Kết quả Auto:", autoRes);
  } catch (err) {
    console.error("-> ❌ Auto Thất bại:", err.message);
  }

  console.log("\n=== Hoàn tất kiểm tra! ===");
}

test();
