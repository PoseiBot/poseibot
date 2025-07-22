require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');
const fetch = require('node-fetch');

const app = express();
const port = process.env.PORT || 3000;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(express.static('public'));
app.use(express.json());

// English keywords to detect news-related queries
const newsKeywords = [
  'news', 'headline', 'breaking', 'today', 'now', 'latest', 'just in', 'press', 'article'
];

function isNewsQuery(text) {
  return newsKeywords.some(keyword => text.toLowerCase().includes(keyword));
}

// Read Poseidon info from .txt files
function loadPoseidonInfo() {
  const files = [
    'poseidon_token_info.txt',
    'poseidon_chronicle.txt',
    'waveRider_guide.txt',
    'poseidon_news.txt',
  ];
  const fileContents = files.map(file => {
    const fullPath = path.join(__dirname, file);
    return fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf-8') : '';
  });
  return fileContents.join('\n\n');
}

// Use Serper for real-time search
async function searchWithSerper(query) {
  const response = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: {
      'X-API-KEY': process.env.SERPER_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ q: query }),
  });

  const data = await response.json();
  return data;
}

app.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;

    let systemPrompt = '';
    let userPrompt = message;

    if (isNewsQuery(message)) {
      const searchResults = await searchWithSerper(message);
      const formattedResults = searchResults.organic?.map(r => `- ${r.title}\n${r.snippet}`).join('\n') || 'No relevant search results.';
      systemPrompt = `You are a helpful assistant who summarizes news based on the following search results:\n${formattedResults}`;
    } else {
      const poseidonData = loadPoseidonInfo();
      systemPrompt = `You are PoseiBot, a helpful assistant. Use the following Poseidon universe and token information to answer the user's question:\n${poseidonData}`;
    }

    const chatCompletion = await openai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      model: 'gpt-4o'
    });

    const reply = chatCompletion.choices[0].message.content;
    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
