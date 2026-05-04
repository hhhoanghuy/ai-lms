require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { GoogleGenerativeAI } = require('@google/generative-ai');

const loadKeys = () => {
  const keys = [];
  if (process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('your_'))
    keys.push({ label: 'KEY_MAIN', value: process.env.GEMINI_API_KEY });
  for (let i = 1; i <= 10; i++) {
    const k = process.env[`GEMINI_API_KEY_${i}`];
    if (k && !k.includes('your_')) keys.push({ label: `KEY_${i}`, value: k });
  }
  return keys;
};

const checkKey = async (label, apiKey) => {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    await model.generateContent('Say "OK" in 1 word.');
    console.log(`✅ ${label} (${apiKey.substring(0, 12)}...): HOẠT ĐỘNG BÌNH THƯỜNG`);
  } catch (err) {
    const masked = apiKey.substring(0, 12) + '...';
    if (err.status === 429 || err.message?.includes('429') || err.message?.includes('quota')) {
      let retrySeconds = null;
      try {
        const retryInfo = err.errorDetails?.find(d => d['@type']?.includes('RetryInfo'));
        if (retryInfo?.retryDelay) retrySeconds = parseInt(retryInfo.retryDelay);
      } catch (_) {}

      if (retrySeconds) {
        const resetTime = new Date(Date.now() + retrySeconds * 1000);
        const hhMM = resetTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' });
        const ddMM = resetTime.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' });
        const remainH = Math.floor(retrySeconds / 3600);
        const remainM = Math.ceil((retrySeconds % 3600) / 60);
        console.log(`❌ ${label} (${masked}): HẾT QUOTA – Reset lúc ${hhMM} ngày ${ddMM} (còn ${remainH}h ${remainM}p)`);
      } else {
        console.log(`❌ ${label} (${masked}): HẾT QUOTA – Reset lúc 14:00 ngày mai (giờ VN)`);
      }
    } else if (err.status === 403) {
      console.log(`🔑 ${label} (${masked}): LỖI APIKEY – Sai hoặc chưa kích hoạt`);
    } else {
      console.log(`⚠️  ${label} (${masked}): LỖI KHÁC – ${err.message.substring(0, 100)}`);
    }
  }
};

(async () => {
  const keys = loadKeys();
  console.log(`\n🔍 Kiểm tra ${keys.length} Gemini Key...\n` + '─'.repeat(60));
  for (const { label, value } of keys) {
    await checkKey(label, value);
  }
  console.log('─'.repeat(60));
  console.log(`\n⏰ Giờ VN hiện tại: ${new Date().toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`);
  console.log(`ℹ️  Gemini Free Tier (RPD) thường reset vào 14:00 hàng ngày.\n`);
})();
