const express = require('express');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname));
app.use(express.json());

// Serve index.html at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const newsKeywords = [
  'news', 'breaking', 'update', 'live', 'today', 'now', 'latest', 'headline', 'media', 'article'
];

const isNewsQuery = (text) => {
  return newsKeywords.some((keyword) => text.toLowerCase().includes(keyword));
};

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
    return res.status(400).json({ reply: 'Missing message content.' });
  }

  try {
    if (isNewsQuery(userMessage)) {
      const response = await fetch('https://google.serper.dev/news', {
        method: 'POST',
        headers: {
          'X-API-KEY': process.env.SERPER_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ q: userMessage })
      });

      const data = await response.json();

      if (data.news && data.news.length > 0) {
        const topNews = data.news
          .slice(0, 3)
          .map(n => `• ${n.title}\n${n.snippet}\n${n.link}`)
          .join('\n\n');

        return res.json({ reply: topNews });
      } else {
        return res.json({ reply: 'No relevant news articles found.' });
      }
    }

    const messages = [
      {
        role: 'system',
        content: `You are PoseiBot, an assistant specialized in Poseidon world-building, tokens, and characters. Use the following background information to answer questions accurately:\n${poseidonKnowledge}`
      },
      {
        role: 'user',
        content: userMessage
      }
    ];

    const chatResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: messages,
        temperature: 0.7,
      }),
    });

    const chatData = await chatResponse.json();
    const answer = chatData.choices?.[0]?.message?.content || 'No response received.';
    return res.json({ reply: answer });
  } catch (error) {
    console.error('Error in /chat:', error);
    return res.status(500).json({ reply: 'Internal server error.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
