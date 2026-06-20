const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testModel(modelName) {
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent("hello");
    const response = await result.response;
    console.log(`[SUCCESS] ${modelName} worked!`);
    return true;
  } catch (e) {
    console.log(`[FAIL] ${modelName}: ${e.message.split('\n')[0]}`);
    return false;
  }
}

async function run() {
  const models = [
    'gemini-1.5-pro',
    'gemini-1.5-flash-8b',
    'gemini-2.0-flash-lite-001',
    'gemini-2.0-flash-lite',
    'gemini-2.5-flash',
    'gemini-flash-latest',
    'gemini-pro-latest',
    'gemini-3.5-flash'
  ];
  for (const m of models) {
    await testModel(m);
  }
}
run();
