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

function appendDivider() {
  const hr = document.createElement("hr");
  hr.className = "message-divider";
  chat.appendChild(hr);
}

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

function sendMessage() {
  const userText = input.value.trim();
  if (!userText) return;
  appendMessage(userText, "user");
  input.value = "";
  fetchBotResponse(userText);
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

// ✅ iOS 대응: 키보드 대응 + 확대된 화면 복구
function forceViewportReset() {
  const vh = window.innerHeight;
  inputContainer.style.position = vh < 500 ? "absolute" : "fixed";
  inputContainer.style.bottom = "0";

  // 전체 화면 강제 복구
  document.documentElement.style.height = vh + "px";
  document.body.style.height = vh + "px";
}

// ✅ 키보드 입력 감지 및 복구 처리
window.addEventListener("resize", forceViewportReset);
window.addEventListener("DOMContentLoaded", forceViewportReset);
window.addEventListener("focusin", forceViewportReset);
window.addEventListener("focusout", () => {
  setTimeout(forceViewportReset, 100); // 키보드 닫힘 후 복구 딜레이
});
