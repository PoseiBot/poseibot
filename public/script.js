const chat = document.getElementById("chat-box");
const input = document.getElementById("input");
const sendBtn = document.getElementById("send-btn");

function appendMessage(content, className) {
  const msg = document.createElement("div");
  msg.className = "message " + className;
  msg.textContent = content;
  chat.appendChild(msg);

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

  fetch("/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message: text }),
  })
    .then((res) => res.json())
    .then((data) => {
      appendMessage(data.answer, "bot");
    })
    .catch(() => {
      appendMessage("⚠️ Failed to get response from the server.", "bot");
    });
}

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

sendBtn.addEventListener("click", sendMessage);

input.addEventListener("focus", () => {
  input.value = "";
});
