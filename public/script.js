const chat = document.getElementById("chat-box");
const input = document.getElementById("input");
const sendBtn = document.getElementById("send-btn");

let spinnerElement = null;

// Append message bubble
function appendMessage(content, type) {
  const msg = document.createElement("div");
  msg.className = "message " + type;
  msg.textContent = content;
  chat.appendChild(msg);

  // Always scroll into view
  msg.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Append divider between Q&A sets
function appendDivider() {
  const hr = document.createElement("hr");
  hr.className = "message-divider";
  chat.appendChild(hr);
}

// Show loading spinner
function showSpinner() {
  spinnerElement = document.createElement("div");
  spinnerElement.className = "message bot spinner";
  spinnerElement.innerHTML = `<div class="loader"></div>`;
  chat.appendChild(spinnerElement);
  spinnerElement.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Remove spinner
function removeSpinner() {
  if (spinnerElement) {
    chat.removeChild(spinnerElement);
    spinnerElement = null;
  }
}

// Send user message to backend and fetch response
async function fetchBotResponse(userText) {
  showSpinner();

  try {
    const response = await fetch("/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message: userText })
    });

    const data = await response.json();
    removeSpinner();

    const reply = data.answer || "(No response)";
    appendMessage(reply, "bot");
    appendDivider();
  } catch (err) {
    console.error("Server error:", err);
    removeSpinner();
    appendMessage("⚠️ Failed to get response from server.", "bot");
    appendDivider();
  }
}

// Send message
function sendMessage() {
  const userText = input.value.trim();
  if (!userText) return;

  appendMessage(userText, "user");
  input.value = "";
  fetchBotResponse(userText);
}

// Event listeners
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

sendBtn.addEventListener("click", sendMessage);

// Clear placeholder on focus
input.addEventListener("focus", () => {
  input.value = "";
});
