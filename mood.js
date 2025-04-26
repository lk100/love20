function loginUser(userId) {
  // Save userId to localStorage
  localStorage.setItem("userId", userId);
  console.log("User ID set in localStorage:", localStorage.getItem("userId"));

  // Force a page reload (optional)
   // Refreshes the page to ensure data is correctly loaded

  // Or trigger the fetchMoodHistory() function directly
  fetchMoodHistory();
}

// Open Mood Modal
function openMoodModal() {
  document.getElementById("mood-modal").style.display = "flex";
  document.body.classList.add("modal-open");
}

// Close Mood Modal
function closeMoodModal() {
  document.getElementById("mood-modal").style.display = "none";
  document.body.classList.remove("modal-open");
}

async function submitMood() {
  const userText = document.getElementById("user-mood-input").value;

  // Retrieve the logged-in user's ID from localStorage
  const userId = localStorage.getItem("userId");

  if (!userId) {
    alert("You must be logged in to submit your mood.");
    return;
  }

  try {
    const response = await fetch("http://localhost:5000/submit-journal", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: userText, user_id: userId }),
    });

    if (!response.ok)
      throw new Error(`Server responded with status: ${response.status}`);

    const result = await response.json();
    if (result.success) {
      alert(`Mood submitted! Predicted emotion: ${result.emotion}`);
      fetchMoodHistory(currentGraphType); // Refresh graph
    } else {
      alert("Failed to submit your mood");
    }
  } catch (error) {
    console.error("Error submitting mood:", error);
    alert("An error occurred while submitting your mood");
  }
}

// Define Emotion Mapping
const emotionLabels = [
  "happiness",
  "admiration",
  "anticipation",
  "boredom",
  "love",
  "excitement",
  "joy",
  "neutral",
  "surprise",
  "remorse",
  "fear",
  "pride",
  "sympathy",
  "contentment",
  "realization",
  "satisfaction",
  "trust",
  "guilt",
  "worry",
  "shame",
  "anger",
  "hope",
  "sadness",
  "tenderness",
  "disappointment",
  "relief",
  "disgust",
  "confusion",
];

let currentGraphType = "date-emotion";
let moodChart = null;

// Retrieve and validate the user ID
function getUserId() {
  const userId = localStorage.getItem("userId");
  if (!userId) {
    alert("You must be logged in to perform this action.");
    throw new Error("User ID not found in localStorage");
  }
  return userId;
}

// Render Mood Graph
function renderMoodGraph(data, graphType) {
  const ctx = document.getElementById("mood-graph-canvas").getContext("2d");

  if (window.moodChart) {
    window.moodChart.destroy(); // Clear the previous chart instance
  }

  const chartConfig = {
    type: graphType,
    data: {
      labels: data.labels, // X-axis labels
      datasets: [
        {
          label: "Mood Data",
          data: data.values, // Y-axis values should correspond to emotion labels
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        tooltip: {
          callbacks: {
            label: function (context) {
              const emotionIndex = context.raw;
              const emotionName = emotionLabels[emotionIndex] || "Unknown";
              return `Emotion: ${emotionName}`;
            },
          },
        },
      },
      scales: {
        y: {
          type: "category",
          labels: emotionLabels, // Ensure labels are correct and unique
          title: {
            display: true,
            text: "Emotion",
          },
          ticks: {
            autoSkip: false, // Ensure all labels are visible
          },
        },
        x: {
          title: {
            display: true,
            text: "Date",
          },
        },
      },
    },
  };
  if (graphType === "date-emotion") {
    const labels = data.map((entry) =>
      new Date(entry.created_at).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
      })
    );

    // Map predicted emotion to index of uniqueEmotionLabels
    const emotions = data
      .map((entry) => {
        const emotion = entry.predicted_emotion.toLowerCase().trim(); // Normalize the emotion (to lowercase and remove spaces)
        const index = emotionLabels.findIndex(
          (label) => label.toLowerCase().trim() === emotion
        );

        console.log(`Predicted Emotion: '${emotion}' --> Index: ${index}`);

        // Handle the case where the emotion is not found in the uniqueEmotionLabels array
        if (index === -1) {
          console.warn(
            `Emotion '${emotion}' not found in uniqueEmotionLabels.`
          );
          return null; // If not found, return null
        }
        return emotion; // Return the index for the emotion
      })
      .filter((emotion) => emotion !== null); // Remove null values

    window.moodChart = new Chart(ctx, {
      type: "line",
      data: {
        labels, // Dates on the x-axis
        datasets: [
          {
            label: "Predicted Emotion Over Time",
            data: emotions, // Emotion indices on the y-axis (mapped to uniqueEmotionLabels)
            borderColor: "rgba(75, 192, 192, 1)",
            backgroundColor: "rgba(75, 192, 192, 0.2)",
            borderWidth: 2,
            tension: 0.3,
            fill: false,
            pointRadius: 5,
            pointBackgroundColor: "rgba(153, 102, 255, 1)",
          },
        ],
      },
      options: {
        scales: {
          y: {
            type: "category",
            labels: emotionLabels,
          },
        },
      },
    });
  } else if (graphType === "pie-chart") {
    // Prepare data for the pie chart
    const emotionCounts = emotionLabels.reduce((counts, emotion) => {
      counts[emotion] = data[emotion] || 0; // Include all emotions with default count 0
      return counts;
    }, {});

    const pieData = {
      labels: Object.keys(emotionCounts), // Emotion labels
      datasets: [
        {
          data: Object.values(emotionCounts), // Counts for each emotion
          backgroundColor: [
            "rgba(255, 99, 132, 0.2)",
            "rgba(54, 162, 235, 0.2)",
            "rgba(255, 206, 86, 0.2)",
            "rgba(75, 192, 192, 0.2)",
            "rgba(153, 102, 255, 0.2)",
            "rgba(255, 159, 64, 0.2)",
          ],
          borderColor: "rgba(0, 0, 0, 0.1)",
          borderWidth: 1,
        },
      ],
    };

    window.moodChart = new Chart(ctx, {
      type: "pie",
      data: pieData,
      options: chartConfig,
    });
  } else {
    alert("Unsupported graph type.");
  }
}
// Fetch Mood History
async function fetchMoodHistory(graphType = "date-emotion") {
  try {
    const userId = getUserId();
    const response = await fetch(
      `http://localhost:5000/mood-history/${userId}?type=${graphType}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch mood history: ${response.status}`);
    }

    const data = await response.json();
    if (graphType === "date-emotion" && data.length > 0) {
      renderMoodGraph(data.reverse(), graphType); // Reverse for chronological order
    } else if (graphType === "pie-chart" && Object.keys(data).length > 0) {
      renderMoodGraph(data, graphType);
    } else {
      alert("No data available for this graph type.");
    }
  } catch (error) {
    console.error("Error fetching mood history:", error);
    alert("An error occurred while fetching mood history.");
  }
}

// Call to fetch data and render the mood graph
fetchMoodHistory("date-emotion");
// Event Listeners for Graph Type Buttons

// Event Listener for "Date vs Emotion" Button
document.getElementById("date-emotion-btn").addEventListener("click", () => {
  // Show the graph container and the date vs emotion graph
  document.getElementById("mood-graph-canvas").style.display = "block";
  document.getElementById("mood-pie-canvas").style.display = "none";

  // Show the graph container
  document.getElementById("mood-graph-canvas-container").style.display =
    "block";

  // Hide the journal entries container
  document.getElementById("journal-entries-container").style.display = "none";

  // Fetch and display the date vs emotion graph
  fetchMoodHistory("date-emotion");
});
let offset = 0; // Start at the first entry
const limit = 10; // Number of entries to fetch at a time

document.getElementById("myjournal-btn").addEventListener("click", () => {
  // Hide the graph canvases
  document.getElementById("mood-graph-canvas").style.display = "none";
  document.getElementById("mood-pie-canvas").style.display = "none";

  // Ensure the graph container is hidden
  document.getElementById("mood-graph-canvas-container").style.display = "none";

  // Show the journal entries container
  document.getElementById("journal-entries-container").style.display = "block";

  // Reset offset to load the first batch of entries
  offset = 0;

  // Fetch and display journal entries
  fetchJournalEntries();
});

// Navigation buttons event listeners
document.getElementById("left-arrow").addEventListener("click", () => {
  if (offset >= limit) {
    offset -= limit;
    fetchJournalEntries();
  }
});

document.getElementById("right-arrow").addEventListener("click", () => {
  offset += limit;
  fetchJournalEntries();
});

async function fetchJournalEntries() {
  const userId = getUserId();
  console.log(`Fetching entries with offset ${offset} and limit ${limit}`); // Debugging log

  try {
    const response = await fetch(
      `http://localhost:5000/get-journal/${userId}?limit=${limit}&offset=${offset}`
    );
    const data = await response.json();
    console.log("Fetched data:", data); // Debugging log

    if (data.length > 0) {
      displayJournalEntries(data);
    } else {
      if (offset >= limit) {
        offset -= limit;
      }
      alert("No more journal entries to display.");
    }
  } catch (error) {
    console.error("Error fetching journal entries:", error);
    alert("An error occurred while fetching journal entries.");
  }
}

function displayJournalEntries(entries) {
  const journalContainer = document.getElementById("journal-entries");
  journalContainer.innerHTML = ""; // Clear previous entries

  // Create table if it doesn't exist
  let table = document.querySelector("#journal-entries table");
  if (!table) {
    table = document.createElement("table");
    table.classList.add("journal-table");

    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    const headers = ["Date", "Journal Text", "Emotion"];
    headers.forEach((headerText) => {
      const th = document.createElement("th");
      th.textContent = headerText;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    journalContainer.appendChild(table);
  }

  const tbody = document.createElement("tbody");
  entries.forEach((entry) => {
    const row = document.createElement("tr");

    const dateCell = document.createElement("td");
    dateCell.textContent = new Date(entry.created_at).toLocaleString();
    row.appendChild(dateCell);

    const textCell = document.createElement("td");
    textCell.textContent = entry.journal_text;
    row.appendChild(textCell);

    const emotionCell = document.createElement("td");
    emotionCell.textContent = entry.predicted_emotion;
    row.appendChild(emotionCell);

    tbody.appendChild(row);
  });

  table.appendChild(tbody);
}



