const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const { OpenAI } = require("openai");

const app = express();
const PORT = process.env.PORT || 3000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "your-api-key-here",
});

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
        {
          role: "system",
          content:
            "You are PoseiBot, a helpful and polite AI assistant. Respond in the same language the user uses.",
        },
        { role: "user", content: userMessage },
      ],
    });

    const answer = chatCompletion.choices[0].message.content.trim();
    res.json({ answer });
  } catch (err) {
    console.error("GPT error:", err);
    res.status(500).json({ answer: "⚠️ An error occurred while processing the response." });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server is running at http://localhost:${PORT}`);
});
