const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const { OpenAI } = require("openai"); // ✅ openai 4.x 방식

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ OpenAI API 키 설정
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "your-api-key-here",
});

// 정적 폴더 설정
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.json());

// 메인 페이지 렌더링
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// ✅ GPT 응답 API
app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;

  try {
    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // 또는 "gpt-4"
      messages: [
        { role: "system", content: "당신은 친절하고 유용한 AI 비서입니다." },
        { role: "user", content: userMessage },
      ],
    });

    const answer = chatCompletion.choices[0].message.content.trim();
    res.json({ answer });
  } catch (err) {
    console.error("GPT 오류:", err);
    res.status(500).json({ answer: "⚠️ GPT 응답 중 오류가 발생했습니다." });
  }
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`✅ Server is running at http://localhost:${PORT}`);
});
