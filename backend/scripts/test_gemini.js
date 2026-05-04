const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const listModels = async () => {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  try {
    const models = await genAI.getGenerativeModel({ model: "gemini-pro" }); // Initial attempt
    console.log("Checking available models...");
    // The listModels method might not be in the direct SDK but we can try a simple request
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Hi");
    console.log("Gemini 1.5 Flash is working!");
  } catch (err) {
    console.error("Gemini 1.5 Flash Failed:", err.message);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent("Hi");
      console.log("Gemini Pro is working!");
    } catch (err2) {
      console.error("Gemini Pro Failed:", err2.message);
    }
  }
};

listModels();
