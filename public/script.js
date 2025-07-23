const chat = document.getElementById("chat");
const input = document.getElementById("input");

function appendMessage(content, className) {
  const msg = document.createElement("div");
  msg.className = "message " + className;
  msg.textContent = content;
  chat.appendChild(msg);
  chat.scrollTop = chat.scrollHeight;
}

function sendMessage() {
  const text = input.value.trim();
  if (!text) return;
  appendMessage(text, "user");
  input.value = "";

  // GPT 응답 예시
  setTimeout(() => {
    appendMessage("GPT 응답 예시: " + text, "bot");
  }, 600);
}

input.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

input.addEventListener("focus", () => {
  input.value = "";
});
