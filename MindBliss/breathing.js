const prompts = ["Inhale", "Hold", "Exhale"];
const times = [4000, 7000, 8000]; // Durations for each phase in ms
let index = 0;
let isRunning = false; // Tracks whether the breathing cycle is running
let countdownInterval; // To manage countdown intervals
let timeoutHandle; // To manage phase timeouts

// Select DOM elements
const stressCard = document.getElementById("stress-card");
const stressPopup = document.getElementById("stress-popup");
const closePopupButton = document.getElementById("stress-close-popup");
const circle = document.querySelector(".circle");
const prompt = document.querySelector(".prompt");
const countdown = document.querySelector(".countdown");

// Function to reset the breathing cycle
function resetBreathing() {
  clearInterval(countdownInterval);
  clearTimeout(timeoutHandle);

  // Reset circle size and color
  circle.style.transform = "scale(1)";
  circle.style.backgroundColor = "#ffffff";
  circle.style.transition = "none"; // Temporarily disable transition
  void circle.offsetWidth; // Trigger reflow
  circle.style.transition = "transform 4s ease-in-out, background-color 4s ease-in-out";

  // Reset prompt and countdown
  prompt.textContent = "Inhale";
  countdown.textContent = 0; // Reset the countdown to 0
}

// Function to start the breathing exercise
function startBreathing() {
  if (isRunning) return; // Prevent multiple clicks

  isRunning = true;
  let currentIndex = 0;

  function updateBreathing() {
    // Update the prompt
    prompt.textContent = prompts[currentIndex];

    // Update circle animation
    if (currentIndex === 0) {
      circle.style.transform = "scale(1.5)"; // Expand on "Inhale"
      circle.style.backgroundColor = "#47a7c4"; // Green for inhale
    } else if (currentIndex === 1) {
      circle.style.transform = "scale(1.5)"; // Hold at expanded size
      circle.style.backgroundColor = "#ffeb3b"; // Yellow for hold
    } else {
      circle.style.transform = "scale(1)"; // Contract on "Exhale"
      circle.style.backgroundColor = "#f44336"; // Red for exhale
    }

    // Countdown logic
    let timeLeft = times[currentIndex] / 1000; // Convert ms to seconds
    countdown.textContent = timeLeft; // Set initial countdown number

    countdownInterval = setInterval(() => {
      timeLeft -= 1;
      countdown.textContent = timeLeft;

      if (timeLeft <= 0) {
        clearInterval(countdownInterval); // Stop the countdown
      }
    }, 1000);

    // Move to the next phase after the current duration
    timeoutHandle = setTimeout(() => {
      currentIndex = (currentIndex + 1) % prompts.length; // Cycle through prompts
      if (currentIndex === 0) {
        resetBreathing(); // Reset to 0 after completing one cycle (4-7-8)
      }
      updateBreathing();
    }, times[currentIndex]);
  }

  updateBreathing(); // Start the breathing cycle
}

// Open popup and start the breathing exercise
stressCard.addEventListener("click", () => {
  stressPopup.style.display = "flex"; // Show popup
  document.body.style.overflow = "hidden"; // Disable background scrolling
  resetBreathing(); // Reset breathing cycle
  startBreathing(); // Start the breathing cycle
});

// Close popup and stop the breathing exercise
closePopupButton.addEventListener("click", () => {
  stressPopup.style.display = "none"; // Hide popup
  document.body.style.overflow = "auto"; // Enable scrolling
  resetBreathing(); // Reset breathing cycle
  isRunning = false; // Allow the breathing cycle to restart next time
});
  