const chat = document.getElementById("chat");
const input = document.getElementById("input");

function appendMessage(content, className) {
  const msg = document.createElement("div");
  msg.className = "message " + className;
  msg.textContent = content;
  chat.appendChild(msg);

  // ✅ bot 답변 뒤에는 separator 추가
  if (className === "bot") {
    const separator = document.createElement("div");
    separator.className = "separator";
    chat.appendChild(separator);
  }

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

// ✅ Enter 키 전송 (Shift+Enter는 줄바꿈 허용)
input.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// ✅ 포커스 시 입력값 초기화
input.addEventListener("focus", () => {
  input.value = "";
});
