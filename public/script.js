const input = document.getElementById("input");
const sendBtn = document.getElementById("send-btn");
const chatBox = document.getElementById("chat-box");

function appendMessage(sender, text) {
  const msg = document.createElement("div");
  msg.className = `bubble ${sender === "user" ? "user-bubble" : "bot-bubble"}`;
  msg.textContent = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function showTyping() {
  const typing = document.createElement("div");
  typing.className = "bubble bot-bubble typing";
  typing.id = "typing-indicator";
  typing.textContent = "Typing...";
  chatBox.appendChild(typing);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function removeTyping() {
  const typing = document.getElementById("typing-indicator");
  if (typing) typing.remove();
}

async function sendMessage() {
  const userMessage = input.value.trim();
  if (userMessage === "") return;
  appendMessage("user", userMessage);
  input.value = "";

  showTyping();

  try {
    const response = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userMessage }),
    });

    const data = await response.json();
    removeTyping();

    if (data.answer) {
      appendMessage("bot", data.answer);
    } else {
      appendMessage("bot", "Sorry, I didn't understand that.");
    }
  } catch (error) {
    removeTyping();
    appendMessage("bot", "There was an error. Please try again.");
  }
}

sendBtn.addEventListener("click", sendMessage);

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

input.addEventListener("focus", () => {
  input.value = "";
});
