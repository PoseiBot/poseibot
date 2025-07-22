const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const { OpenAI } = require('openai');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 정적 파일 서빙 (index.html 포함)
app.use(express.static(path.join(__dirname)));

// JSON 파싱
app.use(express.json());

// POST /chat → OpenAI에 질문 보내기
app.post('/chat', async (req, res) => {
  const userMessage = req.body.message;

  if (!userMessage) {
    return res.status(400).json({ error: 'No message provided' });
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: userMessage }],
    });

    const reply = response.choices[0].message.content;
    res.json({ reply });
  } catch (error) {
    console.error('OpenAI error:', error);
    res.status(500).json({ error: 'Failed to get response from OpenAI' });
  }
});

// 서버 시작
app.listen(port, () => {
  console.log(`✅ Server is running at http://localhost:${port}`);
});
