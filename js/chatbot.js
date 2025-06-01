// Wait for the DOM to fully load before running the script
document.addEventListener("DOMContentLoaded", () => {
  const chatBody = document.getElementById("chat-body");
  const chatInput = document.getElementById("chat-input");
  const chatSend = document.getElementById("chat-send");
  const chatPrompts = document.querySelectorAll(".chat-prompt");

  // Function to append a new message bubble
  function appendMessage(sender, text) {
    const msg = document.createElement("div");
    msg.className = `chat-msg ${sender}`;
    msg.innerHTML = text.replace(/\n/g, "<br>");  // ✅ Preserve line breaks
    chatBody.appendChild(msg);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  // Show welcome messages
  appendMessage("bot", "🏋️‍♂️ Welcome to Big Boss Gym! I'm GymBot.");
  appendMessage("bot", "🤖 You can ask about membership, pricing, classes, trainers, and more!");

  // Function to send user input to backend
  function sendMessage(input) {
    if (!input) return;
    appendMessage("user", input);
    chatInput.value = "";

    // Show typing indicator
    const typingIndicator = document.createElement("div");
    typingIndicator.className = "chat-msg bot typing";
    typingIndicator.textContent = "GymBot is typing...";
    chatBody.appendChild(typingIndicator);
    chatBody.scrollTop = chatBody.scrollHeight;

    // Fetch from backend
    console.log(`[DEBUG] Sending message to backend: "${input}"`);
    fetch(`http://localhost:5000/chatbot?msg=${encodeURIComponent(input)}`)
      .then(res => {
        console.log(`[DEBUG] Received response status: ${res.status}`);
        if (!res.ok) {
          console.error(`[ERROR] Backend returned HTTP status: ${res.status}`);
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.text();
      })
      .then(reply => {
        console.log(`[DEBUG] Backend reply: ${reply}`);
        typingIndicator.remove();
        appendMessage("bot", reply.trim().replace(/\n/g, "<br>"));  // ✅ Convert newlines
      })
      .catch(err => {
        typingIndicator.remove();
        console.error("[ERROR] Failed to fetch from backend:", err);
        appendMessage("bot", "⚠️ Sorry, I couldn't connect to the server.");
      });
  }

  // Send message on button click
  chatSend.addEventListener("click", () => sendMessage(chatInput.value.trim()));

  // Send on Enter key
  chatInput.addEventListener("keypress", e => {
    if (e.key === "Enter") sendMessage(chatInput.value.trim());
  });

  // Predefined prompt buttons
  chatPrompts.forEach(button => {
    button.addEventListener("click", () => {
      sendMessage(button.innerText);
    });
  });
});
