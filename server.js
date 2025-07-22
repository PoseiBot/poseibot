const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const { ChatOpenAI } = require('@langchain/openai');
const { RunnableSequence } = require('@langchain/core/runnables');
const { ChatPromptTemplate } = require('@langchain/core/prompts');
const { Serper } = require('@langchain/community/tools/serper');
const { DynamicTool } = require('@langchain/core/tools');
const { AgentExecutor, createOpenAIFunctionsAgent } = require('langchain/agents');
const { pull } = require('langchain/hub');

dotenv.config();

const app = express();
const port = process.env.PORT || 10000;

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

const poseidonChronicle = fs.readFileSync('poseidon_chronicle.txt', 'utf8');
const tokenInfo = fs.readFileSync('poseidon_token_info.txt', 'utf8');
const waveRiderGuide = fs.readFileSync('waveRider_guide.txt', 'utf8');
const poseidonNews = fs.readFileSync('poseidon_news.txt', 'utf8');

const model = new ChatOpenAI({
  modelName: 'gpt-4o',
  temperature: 0.7,
});

const txtPrompt = ChatPromptTemplate.fromMessages([
  ['system', `
You are PoseiBot, an expert on the Poseidon token ecosystem. Use only the information below to answer questions. If the answer is not found, say you don't know.

[Poseidon Chronicle]
${poseidonChronicle}

[Poseidon Token Info]
${tokenInfo}

[WaveRider Guide]
${waveRiderGuide}

[Poseidon News]
${poseidonNews}
  `],
  ['human', '{input}'],
]);

const txtChain = RunnableSequence.from([
  txtPrompt,
  model,
]);

const txtTool = new DynamicTool({
  name: 'poseidon_text_lookup',
  description: 'Use this tool to answer questions about the Poseidon ecosystem',
  func: async (input) => {
    const res = await txtChain.invoke({ input });
    return res.content;
  },
});

const tools = [
  new Serper({ k: 5 }),
  txtTool,
];

app.post('/chat', async (req, res) => {
  try {
    const input = req.body.message;
    const searchKeywords = ['뉴스', 'news', '업데이트', '기사', 'latest'];

    const useSerper = searchKeywords.some(word => input.toLowerCase().includes(word));

    const selectedTools = useSerper ? tools : [txtTool];

    const prompt = await pull('hwchase17/openai-functions-agent');
    const agent = await createOpenAIFunctionsAgent({
      llm: model,
      tools: selectedTools,
      prompt,
    });

    const executor = new AgentExecutor({
      agent,
      tools: selectedTools,
    });

    const result = await executor.invoke({ input });

    res.json({ answer: result.output });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error processing your request.');
  }
});

// ✅ 루트 경로에서 index.html 서빙
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
