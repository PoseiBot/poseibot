const express = require('express');
const fs = require('fs');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname));
app.use(express.json());

// Serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Handle chat with Serper search + GPT summary
app.post('/chat', async (req, res) => {
  const userMessage = req.body.message;

  if (!userMessage) {
    return res.status(400).json({ reply: 'Missing message content.' });
  }

  try {
    // Step 1: Serper search API 요청
    const serperResponse = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': process.env.SERPER_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q: userMessage })
    });

    const serperData = await serperResponse.json();

    // Step 2: 상위 3~5개 검색 결과 추출
    const organicResults = serperData.organic?.slice(0, 3) || [];

    if (organicResults.length === 0) {
      return res.json({ reply: 'No relevant search results found.' });
    }

    const contextText = organicResults
      .map((item, idx) => `${idx + 1}. ${item.title}\n${item.snippet}\n${item.link}`)
      .join('\n\n');

    // Step 3: GPT에게 요약 지시
    const messages = [
      {
        role: 'system',
        content:
          `You are PoseiBot, an assistant that answers questions using the following web search results.\n\n` +
          `Summarize them clearly and include any useful information.`
      },
      {
        role: 'user',
        content:
          `Here are the search results for "${userMessage}":\n\n${contextText}\n\n` +
          `Please summarize the key information for the user.`
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

    // Step 4: GPT 응답 + 출처 링크 표시
    const links = organicResults.map(r => r.link).join('\n');
    const finalReply = `${answer}\n\n📎 Sources:\n${links}`;

    return res.json({ reply: finalReply });

  } catch (error) {
    console.error('Error in /chat:', error);
    return res.status(500).json({ reply: 'Internal server error.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
