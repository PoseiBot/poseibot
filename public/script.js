const chat = document.getElementById("chat-box");
const input = document.getElementById("input");
const sendBtn = document.getElementById("send-btn");
const inputContainer = document.getElementById("input-container");

let spinnerElement = null;

// Append message bubble
function appendMessage(content, type) {
  const msg = document.createElement("div");
  msg.className = "message " + type;
  msg.textContent = content;
  chat.appendChild(msg);
  msg.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Divider between messages
function appendDivider() {
  const hr = document.createElement("hr");
  hr.className = "message-divider";
  chat.appendChild(hr);
}

// Spinner
function showSpinner() {
  spinnerElement = document.createElement("div");
  spinnerElement.className = "message bot spinner";
  spinnerElement.innerHTML = `<div class="loader"></div>`;
  chat.appendChild(spinnerElement);
  spinnerElement.scrollIntoView({ behavior: "smooth", block: "start" });
}

function removeSpinner() {
  if (spinnerElement) {
    chat.removeChild(spinnerElement);
    spinnerElement = null;
  }
}

// Send to server
async function fetchBotResponse(userText) {
  showSpinner();
  try {
    const response = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userText })
    });

    const data = await response.json();
    removeSpinner();
    appendMessage(data.answer || "(No response)", "bot");
    appendDivider();
  } catch (err) {
    console.error("Server error:", err);
    removeSpinner();
    appendMessage("⚠️ Failed to get response from server.", "bot");
    appendDivider();
  }
}

// Send
function sendMessage() {
  const userText = input.value.trim();
  if (!userText) return;
  appendMessage(userText, "user");
  input.value = "";
  fetchBotResponse(userText);
}

// Send with Enter
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// Button click
sendBtn.addEventListener("click", sendMessage);

// Clear on focus
input.addEventListener("focus", () => {
  input.value = "";
});

// ✅ iOS 대응: 키보드 등장 시 layout 밀림 방지
function adjustInputPosition() {
  const vh = window.innerHeight;
  if (vh < 500) {
    inputContainer.style.position = "absolute";
    inputContainer.style.bottom = "0";
  } else {
    inputContainer.style.position = "fixed";
    inputContainer.style.bottom = "0";
  }

  // ✅ 전체 화면 높이 재설정 (상단 로고 복구용)
  document.documentElement.style.height = `${vh}px`;
  document.body.style.height = `${vh}px`;
}

window.addEventListener("resize", adjustInputPosition);
window.addEventListener("DOMContentLoaded", adjustInputPosition);
