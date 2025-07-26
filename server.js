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

// 🌐 다국어 뉴스 관련 키워드 탐지 함수
function isNewsQuery(text) {
  return /뉴스|news|latest|최근|search|검색|정보|기사|링크|新闻|消息|最近|资讯|ニュース|記事|noticias|últimas|buscar|información|nouvelles|dernières|recherche|nachrichten|neueste|notícias|pesquisa|समाचार|ताज़ा|खोज|berita|terbaru|informasi|tin tức|mới nhất|ค้นหา|ข่าว|новости|поиск|Актуальные|أخبار|مقالات|بحث|معلومة|رابط|جديد/i.test(text);
}

// 🌍 입력 언어에 따라 응답 언어 지시
function detectLangInstruction(text) {
  if (/[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(text)) return "질문에 한국어로 답변해 주세요.";
  if (/[ぁ-んァ-ン一-龯]/.test(text)) return "日本語で答えてください。";
  if (/[\u4e00-\u9fff]/.test(text)) return "请用中文回答。";
  if (/[А-яЁё]/.test(text)) return "Пожалуйста, ответьте по-русски.";
  if (/[أ-ي]/.test(text)) return "يرجى الرد باللغة العربية.";
  if (/[áéíóúñ¿¡]/i.test(text)) return "Por favor responde en español.";
  if (/[éèêàçùœ]/i.test(text)) return "Veuillez répondre en français.";
  if (/[äöüß]/i.test(text)) return "Bitte antworten Sie auf Deutsch.";
  if (/[अ-ह]/.test(text)) return "कृपया हिंदी में उत्तर दें।";
  if (/[ăâêôơưđ]/i.test(text)) return "Vui lòng trả lời bằng tiếng Việt.";
  if (/[ก-๙]/.test(text)) return "กรุณาตอบเป็นภาษาไทย";
  if (/[a-zA-Z]/.test(text)) return "Please answer in English.";
  return "Please answer in English.";
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
    if (isNewsQuery(userInput)) {
      const serperData = await fetchSerperSearch(userInput);
      const summary = formatSerperResults(serperData);
      const langInstruction = detectLangInstruction(userInput);

      const gptNews = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: `${langInstruction} You are a helpful assistant that summarizes live news search results.` },
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

// ✅ 루트 경로에서 index.html 제공
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 PoseiBot server running at http://localhost:${PORT}`);
});
