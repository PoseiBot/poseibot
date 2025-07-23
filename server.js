const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const { Configuration, OpenAIApi } = require("openai");

const app = express();
const PORT = process.env.PORT || 3000;

// OpenAI 설정 (여기에 본인의 API 키 입력)
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY || "your-openai-api-key",
});
const openai = new OpenAIApi(configuration);

// 정적 파일 제공 (public 폴더)
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.json());

// 메인 HTML 렌더링
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// ✅ GPT 연동 엔드포인트
app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;

  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo", // 또는 gpt-4
      messages: [
        { role: "system", content: "당신은 친절한 AI 챗봇입니다." },
        { role: "user", content: userMessage },
      ],
    });

    const answer = completion.data.choices[0].message.content.trim();
    res.json({ answer });
  } catch (error) {
    console.error("GPT 오류:", error.response?.data || error.message);
    res.status(500).json({ answer: "❌ GPT 응답 중 오류가 발생했습니다." });
  }
});

// 서버 실행
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
