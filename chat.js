// Login user and store user ID in localStorage
function loginUser(userId) {
  localStorage.setItem("userId", userId);
  console.log("User ID set in localStorage:", localStorage.getItem("userId"));

  // Reload the page to ensure data loads correctly
  location.reload();

  // Or fetch chat history directly
  fetchChatHistory();
}

// Open Chat Modal
function openChatModal() {
  document.getElementById("chat-modal").style.display = "flex";
  document.body.classList.add("modal-open");
  document.body.classList.add("modal-open");
  fetchFriends();
}

// Close Chat Modal
function closeChatModal() {
  document.getElementById("chat-modal").style.display = "none";
  document.body.classList.remove("modal-open");
}
document.body.classList.remove("modal-open");

// Retrieve and validate the user ID
function getUserId() {
  const userId = localStorage.getItem("userId");
  if (!userId) {
    alert("You must be logged in to access chat.");
    throw new Error("User ID not found in localStorage");
  }
  return userId;
}

// Fetch Chat History
async function fetchChatHistory() {
  try {
    const userId = getUserId();
    const response = await fetch(
      `http://localhost:5000/chat-history/${userId}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch chat history: ${response.status}`);
    }

    const chatData = await response.json();
    if (chatData.length > 0) {
      renderChatMessages(chatData.reverse()); // Reverse to maintain chat order
    } else {
      alert("No chat history available.");
    }
  } catch (error) {
    console.error("Error fetching chat history:", error);
    alert("An error occurred while fetching chat history.");
  }
}

// Fetch Recommended Users Based on Most Occurring Emotion (Complement)
async function fetchRecommendedUsers(type) {
  const userId = getUserId(); // Function to get logged-in user ID
  const recommendationBox = document.querySelector(".chat-users-list");

  try {
    const response = await fetch(
      `http://localhost:5000/recommend-users/${userId}`
    );
    if (!response.ok) throw new Error("Failed to fetch recommended users");

    const data = await response.json();

    // Clear previous recommendations
    recommendationBox.innerHTML = "";

    if (data.recommended_users.length === 0) {
      recommendationBox.innerHTML = "<p>No recommended users found.</p>";
      return;
    }

    // Populate recommendations
    data.recommended_users.forEach((user) => {
      const userDiv = document.createElement("div");
      userDiv.classList.add("recommended-user");
      userDiv.innerHTML = `
              <p><strong>${user.username}</strong></p>
              <button onclick="sendFriendRequest(${user.id})" class="send-request-btn">Add Friend</button>
          `;
      recommendationBox.appendChild(userDiv);
    });
  } catch (error) {
    console.error("❌ Error fetching recommended users:", error);
    recommendationBox.innerHTML = "<p>Could not load recommendations.</p>";
  }
}

// Render Recommended Users in the Suggestion List
function renderRecommendedUsers(users) {
  const usersList = document.querySelector(".chat-users-list");
  usersList.innerHTML = ""; // Clear previous list

  if (!users || users.length === 0) {
    usersList.innerHTML = "<p>No users found with similar personalities.</p>";
    return;
  }

  // Remove duplicate users (if any)
  const uniqueUsers = users.filter(
    (user, index, self) => index === self.findIndex((u) => u.id === user.id)
  );

  uniqueUsers.forEach((user) => {
    const userDiv = document.createElement("div");
    userDiv.classList.add("chat-user-card");

    userDiv.innerHTML = `
            <p><strong>${user.username}</strong></p>
            <button onclick="sendFriendRequest('${user.id}')" class="chat-add-friend-btn">Add Friend</button>
        `;

    usersList.appendChild(userDiv);
  });
}

// Send Friend Request
async function sendFriendRequest(receiverId) {
  try {
    const senderId = getUserId(); // Function to get the logged-in user ID

    if (!senderId || !receiverId) {
      console.error("Error: Missing sender or receiver ID.");
      alert("Invalid friend request. Please try again.");
      return;
    }

    const response = await fetch("http://localhost:5000/send-friend-request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ senderId, receiverId }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to send friend request.");
    }

    alert("Friend request sent successfully!");
  } catch (error) {
    console.error("Error sending friend request:", error);
    alert("An error occurred. Please try again.");
  }
}

async function fetchFriends() {
  try {
    const userId = getUserId();
    const response = await fetch(`http://localhost:5000/get-friends/${userId}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch friends: ${response.status}`);
    }

    const data = await response.json();
    renderFriends(data.friends);
  } catch (error) {
    console.error("Error fetching friends:", error);
    alert("An error occurred while fetching your friends.");
  }
}

function renderFriends(friends) {
  const friendsList = document.querySelector(".chat-friends-list");
  friendsList.innerHTML = ""; // Clear previous list

  if (!friends || friends.length === 0) {
    friendsList.innerHTML = "<p>No friends found.</p>";
    return;
  }

  friends.forEach((friend) => {
    const friendDiv = document.createElement("div");
    friendDiv.classList.add("chat-friend-card");
    friendDiv.setAttribute("data-id", friend.friend_id); // Store friend ID

    friendDiv.innerHTML = `
          <p><strong>${friend.friend_name}</strong></p>
          <button onclick="startChat('${friend.friend_id}')" class="chat-start-btn">Chat</button>
      `;

    friendsList.appendChild(friendDiv);
  });
}

function highlightUnreadFriend() {
  const friendsList = document.querySelectorAll(".chat-friend-card");

  friendsList.forEach((friend) => {
    const friendId = friend.getAttribute("data-id"); // Ensure friend cards have 'data-id'
    if (friendId === activeChatUserId) {
      friend.classList.add("unread-message"); // Add class to change color
    }
  });
}

let activeChatUserId = null; // Declare this variable at the top of chat.js

function startChat(userId) {
  activeChatUserId = userId; // Set the active chat user ID
  document.getElementById("chat-modal").style.display = "flex"; // Open chat modal
  document.body.classList.add("modal-open");

  fetchChatMessages(activeChatUserId); // Load previous messages
}

async function fetchChatMessages(receiverId) {
  const senderId = getUserId();

  try {
    const response = await fetch(
      `http://localhost:5000/get-messages/${senderId}/${receiverId}`
    );
    if (!response.ok) throw new Error("Failed to load chat.");

    const data = await response.json();
    const chatBox = document.querySelector(".chat-box");
    chatBox.innerHTML = ""; // Clear previous messages

    data.messages.forEach((msg) => {
      const messageDiv = document.createElement("div");

      // If sender_id matches logged-in user, align right (sent message)
      if (msg.sender_id == senderId) {
        messageDiv.classList.add("chat-message", "chat-message-sent");
      } else {
        messageDiv.classList.add("chat-message", "chat-message-received");
      }

      messageDiv.innerHTML = `<p> ${msg.message}</p>`;
      chatBox.appendChild(messageDiv);
    });
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    alert("Error loading chat messages.");
  }
}

function renderChatMessages(messages) {
  const chatBox = document.querySelector(".chat-box");
  chatBox.innerHTML = ""; // Clear previous messages

  const userId = getUserId(); // Current logged-in user
  let hasUnreadMessages = false; // Flag for unread messages

  messages.forEach((msg) => {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("chat-message");

    // Check if the message is sent or received
    if (msg.sender_id === userId) {
      messageDiv.classList.add("sent-message"); // Right-side alignment
    } else {
      messageDiv.classList.add("received-message"); // Left-side alignment
      if (!msg.is_seen) {
        // Check for unread messages
        hasUnreadMessages = true;
      }
    }

    // Remove sender/receiver name and only show the message text
    messageDiv.innerHTML = `<p>${msg.message_text}</p>`;

    chatBox.appendChild(messageDiv);
  });

  // Auto-scroll to the latest message
  chatBox.scrollTop = chatBox.scrollHeight;

  // Change friend card color if there are unread messages
  if (hasUnreadMessages) {
    highlightUnreadFriend();
  }
}

async function sendMessage() {
  const senderId = getUserId(); // Fetch sender ID from localStorage
  if (!activeChatUserId) {
    alert("Select a chat first!");
    return;
  }

  const message = document.querySelector(".chat-message-input").value.trim();
  if (!message) {
    alert("Please enter a message!");
    return;
  }

  try {
    const response = await fetch("http://localhost:5000/send-message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ senderId, receiverId: activeChatUserId, message }),
    });

    if (!response.ok) {
      throw new Error("Failed to send message.");
    }

    document.querySelector(".chat-message-input").value = ""; // Clear input
    fetchChatMessages(activeChatUserId); // Reload chat messages
  } catch (error) {
    console.error("Error sending message:", error);
    alert("Error sending message.");
  }
}
