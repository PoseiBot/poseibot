const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { ChatOpenAI } = require('@langchain/openai');
const { ChatPromptTemplate } = require('@langchain/core/prompts');
const { RunnableSequence } = require('@langchain/core/runnables');

dotenv.config();

const app = express();
const port = process.env.PORT || 10000;

app.use(express.static('public')); // ✅ public 폴더에서 이미지 제공
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const systemPrompt = `
You are PoseiBot, an AI assistant for the Poseidon project.
You will answer in a friendly and natural tone, and occasionally use emojis.
Only cite external URLs if they are included in the user's request or are part of real-time search results.

Poseidon project info:
- Token details:
${fs.readFileSync('./poseidon_token_info.txt', 'utf8')}

- Worldview and narrative:
${fs.readFileSync('./poseidon_chronicle.txt', 'utf8')}

- WaveRider Guide:
${fs.readFileSync('./waveRider_guide.txt', 'utf8')}

- Internal news:
${fs.readFileSync('./poseidon_news.txt', 'utf8')}
`;

const model = new ChatOpenAI({
  modelName: 'gpt-4o',
  temperature: 0.7,
  openAIApiKey: process.env.OPENAI_API_KEY,
});

const prompt = ChatPromptTemplate.fromMessages([
  ['system', systemPrompt],
  ['human', '{input}'],
]);

const chain = RunnableSequence.from([prompt, model]);

// 🧠 실시간 뉴스나 웹 검색이 필요한 경우
async function fetchSerperResult(query) {
  const url = 'https://google.serper.dev/search';
  const headers = {
    'X-API-KEY': process.env.SERPER_API_KEY,
    'Content-Type': 'application/json',
  };

  try {
    const response = await axios.post(url, { q: query }, { headers });
    const result = response.data;
    if (!result || !result.organic) return null;

    const summaries = result.organic.slice(0, 3).map((item, idx) => {
      return `${idx + 1}. **${item.title}** - ${item.snippet} ([source](${item.link}))`;
    });

    return summaries.length
      ? `Here are the latest updates I found:\n\n${summaries.join('\n\n')}`
      : null;
  } catch (err) {
    return null;
  }
}

app.post('/chat', async (req, res) => {
  const userInput = req.body.message;

  try {
    // 뉴스나 웹 관련 키워드일 경우만 실시간 검색
    const keywords = ['news', 'latest', 'update', '소식', '뉴스'];
    const isSearch = keywords.some((word) => userInput.toLowerCase().includes(word));

    if (isSearch) {
      const searchReply = await fetchSerperResult(userInput);
      if (searchReply) {
        return res.json({ reply: searchReply });
      }
    }

    const gptResponse = await chain.invoke({ input: userInput });
    let output = gptResponse.content;

    // 불확실한 내용이 포함될 경우 베타 알림
    if (output.toLowerCase().includes('not sure') || output.includes('might be')) {
      output += `\n\n⚠️ *Note: PoseiBot is still in beta, and some information may be refined in future updates.*`;
    }

    res.json({ reply: output });
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ reply: 'Sorry, something went wrong.' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
