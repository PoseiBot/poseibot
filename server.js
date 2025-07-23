const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const fs = require("fs");
const { OpenAI } = require("openai");

const app = express();
const PORT = process.env.PORT || 3000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "your-api-key-here",
});

// ✅ 텍스트 파일 로드
const poseidonChronicle = fs.readFileSync("poseidon_chronicle.txt", "utf8");
const tokenInfo = fs.readFileSync("poseidon_token_info.txt", "utf8");
const waveRiderGuide = fs.readFileSync("waveRider_guide.txt", "utf8");
const poseidonNews = fs.readFileSync("poseidon_news.txt", "utf8"); // ✅ 추가

// ✅ 시스템 프롬프트
const SYSTEM_PROMPT = `
You are PoseiBot, an AI assistant for the Poseidon project.
You must respond naturally and helpfully in the user's language (Korean or English).
Always answer based on the following internal project context:

[📘 Poseidon Chronicle]
${poseidonChronicle}

[🪙 Token Info]
${tokenInfo}

[🌊 WaveRider Guide]
${waveRiderGuide}

[📰 Project News & Updates]
${poseidonNews}
`;

app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;

  try {
    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
    });

    const answer = chatCompletion.choices[0].message.content.trim();
    res.json({ answer });
  } catch (err) {
    console.error("❌ GPT error:", err);
    res.status(500).json({ answer: "⚠️ An error occurred while processing the response." });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
