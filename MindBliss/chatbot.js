// Toggle the chatbot visibility
function toggleChatbot() {
  const chatbot = document.getElementById("chatbot");
  chatbot.style.display =
    chatbot.style.display === "none" || chatbot.style.display === ""
      ? "block"
      : "none";
}

// Function to send a message
async function sendMessage() {
  const userInput = document.getElementById("user-message");
  const userMessage = userInput.value.trim();

  if (userMessage === "") return; // Prevent sending empty messages

  const chatbotBody = document.getElementById("chatbot-body");

  // Display user message
  const userMessageElement = createMessageElement(userMessage, "user");
  chatbotBody.appendChild(userMessageElement);
  userInput.value = "";

  // Display typing indicator
  const typingIndicator = createMessageElement("Bot is typing...", "bot");
  chatbotBody.appendChild(typingIndicator);

  // Get AI response
  const aiResponse = await getAIResponse(userMessage);

  // Remove typing indicator
  typingIndicator.remove();

  // Display AI response
  const botMessageElement = createMessageElement(aiResponse, "bot", true);
  chatbotBody.appendChild(botMessageElement);
}

// Function to create message elements
function createMessageElement(message, sender, isHTML = false) {
  const messageElement = document.createElement("div");
  messageElement.classList.add("chatbot-message", sender);
  if (isHTML) {
    messageElement.innerHTML = message; // For AI responses with formatting
  } else {
    messageElement.textContent = message; // For plain text (user input)
  }
  return messageElement;
}

// Function to communicate with the backend
// Function to communicate with the backend
async function getAIResponse(userMessage) {
  try {
    const response = await fetch("http://localhost:5000/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: userMessage }),
    });

    if (!response.ok) {
      throw new Error("Error with the chatbot API");
    }

    const data = await response.json();
    const cleanedResponse = cleanResponse(data.message);
    return cleanedResponse;
  } catch (error) {
    console.error("Error:", error);
    return "Sorry, there was an error processing your message.";
  }
}

// Function to clean the response text (remove stars or other unwanted characters)
function cleanResponse(response) {
  // Remove stars (or any other unwanted characters)
  // Using a regular expression to remove any stars (you can adjust the regex to match other characters if needed)
  const cleanedResponse = response.replace(/\*/g, "").replace(/\n/g, "<br>"); // Replace stars with an empty string
  return cleanedResponse;
}

// Auto-scroll functionality with MutationObserver
const chatbotBody = document.getElementById("chatbot-body");

// Function to handle auto-scrolling
const autoScroll = () => {
  chatbotBody.scroll({
    top: chatbotBody.scrollHeight,
    behavior: "smooth",
  });
};

// Set up MutationObserver
const observer = new MutationObserver(() => {
  autoScroll();
});

// Start observing the chatbot body for child list changes
observer.observe(chatbotBody, { childList: true });
