const express = require('express');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files (e.g., index.html, css, etc.)
app.use(express.static(__dirname));

// Serve index.html at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Helper: detect news-related query
const newsKeywords = [
  'news', 'breaking', 'update', 'live', 'today', 'now', 'latest', 'headline', 'media', 'article'
];

const isNewsQuery = (text) => {
  return newsKeywords.some((keyword) => text.toLowerCase().includes(keyword));
};

// Load Poseidon knowledge base files
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

// Handle user prompt
app.get('/ask', async (req, res) => {
  const query = req.query.q;

  if (!query) {
    return res.status(400).send('Missing query');
  }

  try {
    // If it's a news-related query, use Serper API
    if (isNewsQuery(query)) {
      const response = await fetch('https://google.serper.dev/news', {
        method: 'POST',
        headers: {
          'X-API-KEY': process.env.SERPER_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ q: query })
      });

      const data = await response.json();
      if (data.news && data.news.length > 0) {
        const topNews = data.news.slice(0, 3).map(n => `• ${n.title} (${n.link})`).join('\n');
        return res.send(`Here are the top news articles:\n\n${topNews}`);
      } else {
        return res.send('No relevant news articles found.');
      }
    }

    // Otherwise, use OpenAI with Poseidon knowledge
    const messages = [
      {
        role: 'system',
        content: `You are PoseiBot, an assistant specialized in Poseidon world-building, tokens, and characters. Use the following background information to answer questions accurately:\n${poseidonKnowledge}`
      },
      {
        role: 'user',
        content: query
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
    const answer = chatData.choices?.[0]?.message?.content || 'No answer received.';
    res.send(answer);
  } catch (error) {
    console.error('Error handling /ask:', error);
    res.status(500).send('An error occurred.');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
