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
function openFriendRequestModal() {
  document.getElementById("friendRequestsModal").style.display = "flex";
  document.body.classList.add("modal-open");
  fetchReceivedFriendRequests();
}

// Close Chat Modal
function closeFriendRequestModal() {
  document.getElementById("friendRequestsModal").style.display = "none";
  document.body.classList.remove("modal-open");
}

// Retrieve and validate the user ID

async function fetchReceivedFriendRequests() {
  try {
    const userId = getUserId(); // Get logged-in user ID
    const response = await fetch(
      `https://mindbliss.up.railway.app/received-friend-requests/${userId}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch friend requests: ${response.status}`);
    }

    const requests = await response.json();
    renderFriendRequests(requests);
  } catch (error) {
    console.error("Error fetching friend requests:", error);
    alert("An error occurred while fetching friend requests.");
  }
}

function renderFriendRequests(requests) {
  const list = document.getElementById("friendRequestsList"); // Make sure this ID exists in your HTML
  list.innerHTML = ""; // Clear previous requests

  if (requests.length === 0) {
    list.innerHTML = "<p>No new friend requests.</p>";
    return;
  }

  requests.forEach((request) => {
    const listItem = document.createElement("li");
    listItem.classList.add("friend-request-item");
    listItem.innerHTML = `
            <p><strong>${request.sender_name}</strong> sent you a friend request</p>
            <button onclick="acceptFriendRequest(${request.id})" class="accept-btn">Accept</button>
            <button onclick="rejectFriendRequest(${request.id})" class="reject-btn">Decline</button>
        `;
    list.appendChild(listItem);
  });
}

async function acceptFriendRequest(requestId) {
  try {
    const response = await fetch(
      "https://mindbliss.up.railway.app/accept-friend-request",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to accept friend request.");
    }

    alert("Friend request accepted!");

    // Refresh the recommended users list to remove accepted friends
    fetchRecommendedUsers();
  } catch (error) {
    console.error("Error accepting friend request:", error);
  }
}

function rejectFriendRequest(requestId) {
  fetch("http://mindbliss.up.railway.app/reject-friend-request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ requestId }),
  })
    .then((response) => response.json())
    .then((data) => {
      alert(data.message);
      fetchReceivedFriendRequests(); // Refresh the list
    })
    .catch((error) => console.error("Error rejecting friend request:", error));
}
