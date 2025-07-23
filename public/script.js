const chat = document.getElementById("chat-box");
const input = document.getElementById("input");
const sendBtn = document.getElementById("send-btn");
const inputContainer = document.getElementById("input-container");

let spinnerElement = null;

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

// ✅ iOS Safari 대응 - 화면 확대 후 복구 대응
function adjustViewportHeight() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
  document.body.style.height = `${vh * 100}px`;
}

window.addEventListener("resize", adjustViewportHeight);
window.addEventListener("orientationchange", adjustViewportHeight);
window.addEventListener("DOMContentLoaded", adjustViewportHeight);
window.addEventListener("focusout", () => {
  setTimeout(adjustViewportHeight, 150);
});
