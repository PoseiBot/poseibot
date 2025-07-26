// ✅ server.js - GPT 응답 + 시스템 프롬프트 5종 + Serper 뉴스 검색 포함

const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const { OpenAI } = require("openai");
require("dotenv").config();

const app = express();
app.use(bodyParser.json());
app.use(express.static("public"));

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 📄 시스템 프롬프트 문서 5종 로딩
const poseidonChronicle = fs.readFileSync("./poseidon_chronicle.txt", "utf-8");
const tokenInfo = fs.readFileSync("./poseidon_token_info.txt", "utf-8");
const waveRiderGuide = fs.readFileSync("./waveRider_guide.txt", "utf-8");
const poseidonNews = fs.readFileSync("./poseidon_news.txt", "utf-8");
const poseidonMarketing = fs.readFileSync("./poseidon_marketing.txt", "utf-8");

const systemPrompt = `
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

[Marketing Info]
${poseidonMarketing}
`;

// 🔎 뉴스 질문 판별 함수
function isNewsQuery(text) {
  return /뉴스|news|latest|최근|search|검색|정보|기사|링크/i.test(text);
}

// 🔗 SERPER API로 웹 검색
async function fetchSerperSearch(query) {
  const res = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "X-API-KEY": process.env.SERPER_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ q: query })
  });
  return await res.json();
}

// 🤖 GPT 요약용 메시지 생성
function formatSerperResults(json) {
  const results = json.organic?.slice(0, 3) || [];
  if (results.length === 0) return "No relevant search results found.";
  return results.map(r => `- ${r.title}\n${r.snippet}\n${r.link}`).join("\n\n");
}

// 📮 POST /chat 라우트
app.post("/chat", async (req, res) => {
  const userInput = req.body.message || "";

  try {
    // 🔍 뉴스 관련 질문이면 Serper 사용
    if (isNewsQuery(userInput)) {
      const serperData = await fetchSerperSearch(userInput);
      const summary = formatSerperResults(serperData);

      const gptNews = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are a helpful assistant that summarizes live news search results." },
          { role: "user", content: `Summarize the following search results:\n\n${summary}` }
        ]
      });

      return res.json({ answer: gptNews.choices[0].message.content });
    }

    // 🧠 일반 질문은 시스템 프롬프트 사용
    const gptResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userInput }
      ]
    });

    res.json({ answer: gptResponse.choices[0].message.content });

  } catch (err) {
    console.error("[GPT ERROR]", err);
    res.status(500).json({ answer: "⚠️ GPT response error." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 PoseiBot server running at http://localhost:${PORT}`);
});
