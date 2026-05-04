const { GoogleGenerativeAI } = require("@google/generative-ai");

const getApiKeys = () => {
  const keys = Object.keys(process.env)
    .filter(key => key.startsWith('GEMINI_API_KEY'))
    .map(key => process.env[key])
    .filter(value => value && value.trim() !== "");
  return keys.sort((a, b) => a === process.env.GEMINI_API_KEY ? -1 : 1);
};

const apiKeys = getApiKeys();
let currentKeyIndex = 0;

const callAI = async (promptParts, options = {}) => {
  const { modelName = "gemini-2.5-flash", generationConfig = { temperature: 0 } } = options;

  if (apiKeys.length === 0) throw new Error("⛔ KHÔNG TÌM THẤY GEMINI API KEY TRONG BIẾN MÔI TRƯỜNG");

  let lastError = null;
  // Thử lần lượt các Key nếu bị lỗi (Quá tải, Hết hạn mức...)
  for (let i = 0; i < apiKeys.length; i++) {
    const apiKey = apiKeys[currentKeyIndex];
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: modelName, generationConfig });
      
      const result = await model.generateContent(promptParts);
      const response = await result.response;
      const text = response.text();
      
      // Xoay vòng key cho lần sau
      currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
      return text;
    } catch (err) {
      console.error(`[AI-Client] ⚠️ Key ${currentKeyIndex + 1} lỗi:`, err.message);
      lastError = err;
      // Chuyển sang Key tiếp theo
      currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
    }
  }

  throw new Error(`AI bị lỗi sau khi thử toàn bộ ${apiKeys.length} Key: ` + lastError.message);
};

module.exports = { callAI };
