const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { ChatOpenAI } = require('@langchain/openai');
const { ChatPromptTemplate, MessagesPlaceholder } = require('@langchain/core/prompts');
const { RunnableSequence } = require('@langchain/core/runnables');
require('dotenv').config();

// 텍스트 파일 로딩
function loadText(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err.message);
    return '';
  }
}

const poseidonChronicle = loadText(path.join(__dirname, 'poseidon_chronicle.txt'));
const tokenInfo = loadText(path.join(__dirname, 'poseidon_token_info.txt'));
const waveRiderGuide = loadText(path.join(__dirname, 'waveRider_guide.txt'));
const poseidonNews = loadText(path.join(__dirname, 'poseidon_news.txt'));

const app = express();
const port = process.env.PORT || 10000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const model = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: 'gpt-4o',
  temperature: 0.5,
});

const prompt = ChatPromptTemplate.fromMessages([
  ['system', `너는 PoseiBot이라는 이름의 AI로, Poseidon 토큰 생태계에 대해 전문적으로 답변하는 역할이야. 다음 정보를 기반으로 사용자 질문에 친절하고 자연스럽게 응답해:

[Poseidon 세계관 정보]
${poseidonChronicle}

[Poseidon 토큰 정보]
${tokenInfo}

[WaveRider 가이드 정보]
${waveRiderGuide}

[내부 뉴스 / 검색어가 뉴스 관련일 경우 참고됨]
${poseidonNews}
`],
  new MessagesPlaceholder('chat_history'),
  ['user', '{input}'],
]);

const chain = prompt.pipe(model);

app.post('/chat', async (req, res) => {
  const { messages } = req.body;
  if (!messages) return res.status(400).json({ error: 'Missing messages field' });

  try {
    const response = await chain.invoke({
      input: messages[messages.length - 1].content,
      chat_history: messages.slice(0, -1),
    });

    res.json({ answer: response.content });
  } catch (err) {
    console.error('Error generating response:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
