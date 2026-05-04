const { callAI } = require('./backend/services/aiClient');
const dotenv = require('dotenv');
dotenv.config({ path: './backend/.env' });

async function test() {
  try {
    const res = await callAI("Say hello", { modelName: "gemini-2.0-flash" });
    console.log("AI Response:", res);
  } catch (err) {
    console.error("AI Error:", err.message);
  }
}
test();
