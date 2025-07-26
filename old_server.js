const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { ChatOpenAI } = require('@langchain/openai');
const { ChatPromptTemplate } = require('@langchain/core/prompts');
const { RunnablePassthrough, RunnableMap, RunnableSequence } = require('@langchain/core/runnables');

dotenv.config();
const app = express();
const port = process.env.PORT || 10000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// 텍스트 파일 로드
function loadText(filePath) {
  try {
    return fs.readFileSync(path.join(__dirname, filePath), 'utf-8');
  } catch (err) {
    console.error(`파일을 불러오는 중 오류 발생: ${filePath}`);
    return '';
  }
}

const poseidonChronicle = loadText('poseidon_chronicle.txt');
const tokenInfo = loadText('poseidon_token_info.txt');
const waveRiderGuide = loadText('waveRider_guide.txt');
const poseidonNews = loadText('poseidon_news.txt');

const SYSTEM_PROMPT = `
You are PoseiBot, an assistant for the Poseidon token ecosystem.
Use the following context to answer questions naturally like a friendly assistant, without being overly robotic.

[Chronicle]
${poseidonChronicle}

[Token Info]
${tokenInfo}

[WaveRider Guide]
${waveRiderGuide}

[Poseidon News]
${poseidonNews}
`;

const model = new ChatOpenAI({
  temperature: 0.7,
  openAIApiKey: process.env.OPENAI_API_KEY,
});

const prompt = ChatPromptTemplate.fromMessages([
  ['system', SYSTEM_PROMPT],
  ['human', '{question}'],
]);

const chain = prompt.pipe(model);

async function fetchSerperSearch(query) {
  const config = {
    method: 'post',
    url: 'https://google.serper.dev/search',
    headers: {
      'X-API-KEY': process.env.SERPER_API_KEY,
      'Content-Type': 'application/json',
    },
    data: JSON.stringify({ q: query }),
  };

  try {
    const response = await axios.request(config);
    return response.data;
  } catch (error) {
    console.error('Serper API Error:', error.message);
    return null;
  }
}

function summarizeSearchResults(data) {
  if (!data || !data.organic) return 'No results found.';
  const topResults = data.organic.slice(0, 3);
  return topResults.map((item, i) =>
    `${i + 1}. ${item.title}\n${item.link}`
  ).join('\n\n');
}

app.post('/chat', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ answer: 'No input provided.' });
  }

  const isSearchQuery = /뉴스|news|latest|최근|search|검색|정보|기사|링크/i.test(message);

  try {
    if (isSearchQuery) {
      const results = await fetchSerperSearch(message);
      const searchReply = summarizeSearchResults(results) || 'No relevant search results found.';
      return res.json({ answer: searchReply });
    }

    const input = { question: message };
    const output = await chain.invoke(input);
    res.json({ answer: output.content });
  } catch (error) {
    console.error('Chat error:', error.message);
    res.status(500).json({ answer: 'Sorry, something went wrong.' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
