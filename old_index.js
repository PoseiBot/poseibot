require('dotenv').config();
const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function runTest() {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: 'Hello, who are you?' }],
    });

    console.log('✅ Response:', response.choices[0].message.content);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

runTest();
