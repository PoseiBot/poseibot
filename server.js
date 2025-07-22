const express = require('express');
const fs = require('fs');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname));
app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

function isSearchIntent(text) {
  const keywords = ['news', 'latest', 'update', '소식', '뉴스', '최근', '기사', '정보'];
  return keywords.some(keyword => text.toLowerCase().includes(keyword));
}

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

app.post('/chat', async (req, res) => {
  const userMessage = req.body.message;
  if (!userMessage) {
    return res.status(400).json({ reply: 'Message is empty.' });
  }

  try {
    let gptMessages;

    if (isSearchIntent(userMessage)) {
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
        return res.json({ reply: 'No relevant search results found.' });
      }

      const webContext = topResults
        .map((item, i) => `${i + 1}. ${item.title}\n${item.snippet}\n${item.link}`)
        .join('\n\n');

      gptMessages = [
        {
          role: 'system',
          content:
            `You are PoseiBot, a friendly assistant of the Poseidon project. Speak warmly, informally, and avoid sounding robotic. Use the search results below to answer clearly. If information is uncertain, say so, and mention the bot is still in beta.\n\n${webContext}`
        },
        {
          role: 'user',
          content: userMessage
        }
      ];
    } else {
      gptMessages = [
        {
          role: 'system',
          content:
            `You are PoseiBot 🌊, a friendly and helpful assistant representing the Poseidon project. Speak casually like a team member. If something is unclear, say so politely. Mention the bot is in beta when appropriate. Use this knowledge:\n${poseidonKnowledge}`
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
    let answer = gptData.choices?.[0]?.message?.content || 'No response received.';

    // 불확실한 응답일 경우 베타 메시지 추가
    if (/not sure|uncertain|cannot confirm|no information|sorry/i.test(answer)) {
      answer += `\n\n⚠️ Please note: PoseiBot is currently in beta. This answer is based on available data and may not be fully accurate. We're continuously improving the bot based on real user feedback.`;
    }

    return res.json({ reply: answer });

  } catch (err) {
    console.error('Error in /chat:', err);
    return res.status(500).json({ reply: 'Internal server error.' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ PoseiBot is running at http://localhost:${PORT}`);
});
