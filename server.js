const express = require('express');
const fs = require('fs');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname));
app.use(express.json());

// 기본 페이지
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 외부 검색이 필요한 질문인지 판단
function isSearchIntent(text) {
  const keywords = ['news', 'latest', 'update', '소식', '뉴스', '최근', '기사', '정보'];
  return keywords.some(keyword => text.toLowerCase().includes(keyword));
}

// 포세이돈 세계관 지식 불러오기
function loadPoseidonKnowledge() {
  const files = [
    'poseidon_token_info.txt',
    'poseidon_chronicle.txt',
    'waveRider_guide.txt',
    'poseidon_news.txt'
  ];

  let knowledge = '';
  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(__dirname, file), 'utf-8');
      knowledge += `\n\n[${file}]\n${content}`;
    } catch (err) {
      console.warn(`Warning: could not read ${file}`);
    }
  }

  return knowledge;
}

const poseidonKnowledge = loadPoseidonKnowledge();

// POST /chat 핸들러
app.post('/chat', async (req, res) => {
  const userMessage = req.body.message;

  if (!userMessage) {
    return res.status(400).json({ reply: '질문이 비어 있어요!' });
  }

  try {
    let gptMessages;

    if (isSearchIntent(userMessage)) {
      // 🔍 검색 기반 질문이면 → Serper로 웹 검색 후 GPT 요약
      const serperRes = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': process.env.SERPER_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ q: userMessage })
      });

      const serperData = await serperRes.json();
      const topResults = serperData.organic?.slice(0, 3) || [];

      if (topResults.length === 0) {
        return res.json({ reply: '관련된 웹 검색 결과를 찾지 못했어요. 😢' });
      }

      const webContext = topResults
        .map((item, i) => `${i + 1}. ${item.title}\n${item.snippet}\n${item.link}`)
        .join('\n\n');

      gptMessages = [
        {
          role: 'system',
          content:
            `You are PoseiBot, a friendly assistant from the Poseidon project. Speak like a helpful, curious, and light-hearted guide. Use the web search results below to answer naturally and clearly:\n\n${webContext}`
        },
        {
          role: 'user',
          content: userMessage
        }
      ];
    } else {
      // 🤖 일반 질문이면 → Poseidon 세계관 + GPT 응답
      gptMessages = [
        {
          role: 'system',
          content:
            `You are PoseiBot 🌊, a friendly and helpful assistant representing the Poseidon project. Speak casually and warmly, like a friendly team member. Use the following knowledge to answer:\n${poseidonKnowledge}`
        },
        {
          role: 'user',
          content: userMessage
        }
      ];
    }

    const gptRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: gptMessages,
        temperature: 0.7,
      }),
    });

    const gptData = await gptRes.json();
    const reply = gptData.choices?.[0]?.message?.content || '응답을 받지 못했어요. 😅';
    return res.json({ reply });

  } catch (err) {
    console.error('❌ Error in /chat:', err);
    return res.status(500).json({ reply: '서버에서 오류가 발생했어요. 잠시 후 다시 시도해 주세요 🙏' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ PoseiBot is running at http://localhost:${PORT}`);
});
