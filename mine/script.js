// ------------------ Data ------------------
const imageFiles = [
  "1.jpg", "2.jpg", "3.jpg", "4.jpeg", "5.jpeg", "6.jpeg", "7.jpg",
  "8.jpeg", "9.jpeg", "10.jpg", "11.jpeg", "12.jpeg", "13.jpg",
  "14.jpg", "15.jpeg", "16.jpeg", "17.jpeg", "18.jpeg", "19.jpeg", "20.jpeg",
  "21.jpg", "22.jpeg", "23.jpg", "24.jpg", "25.jpg", "26.jpg", "27.jpeg",
  "28.jpeg", "29.jpeg", "30.jpeg", "31.jpeg", "32.jpg", "33.jpeg"
];

const reasons = [
  // 20 Reasons Why I Love You
  "Your smile lights up my entire world 🌸",
  "Your laugh is the sweetest sound I know ✨",
  "Your hugs feel like home and safety 💖",
  "Your kisses make everything better 💋",
  "Your eyes sparkle with warmth and love 🌟",
  "You have the kindest heart 🌷",
  "Your energy is so positive and uplifting 🌼",
  "You make ordinary days feel magical 🕊️",
  "You’re always playful and fun 💫",
  "Your voice soothes my mind and soul 🎶",
  "Your presence makes every moment brighter 🌟",
  "You laugh at my silly jokes and make me feel special 😂",
  "Your touch is gentle but electrifying ⚡",
  "You celebrate small moments like they’re huge 🎉",
  "You always find a reason to smile 😊",
  "You spread happiness wherever you go 🌞",
  "You brighten the darkest of days 🌈",
  "You surprise me with thoughtful gestures 🎁",
  "Your warmth makes everyone feel loved ❤️",
  "You are my favorite reason to be happy every day 💖",

  // 13 More Reasons
  "The way you make me feel truly seen and understood ❤️",
  "Your confidence draws me closer every time 🌟",
  "Your intelligence leaves me in awe 🧠",
  "Your compassion for others inspires me 🌸",
  "Your curiosity and sense of adventure excite me ✨",
  "The sparkle in your eyes when you’re passionate 🌙",
  "You make me laugh even on tough days 😂",
  "You challenge me to be better, yet accept me as I am 💪",
  "The little quirks that make you uniquely you 🌈",
  "Your kindness radiates effortlessly 🌿",
  "Your presence makes everything feel right 🏡",
  "You make ordinary moments feel extraordinary 💖",
  "You make me fall for you again and again, every day 💫"
];

// ------------------ DOM Elements ------------------
const intro1 = document.getElementById("intro1");
const intro2 = document.getElementById("intro2");
const cardsContainer = document.querySelector(".cards-container");
const card1 = document.getElementById("card1");
const card2 = document.getElementById("card2");
const counter = document.getElementById("counter");
const exitBtn = document.getElementById("exitBtn");
const closingScreen = document.getElementById("closingScreen");

let index = 0;
let activeCard = 1;

// ------------------ Intro Flow ------------------
intro1.addEventListener("click", () => {
  intro1.classList.add("hidden");
  cardsContainer.classList.remove("hidden");
  counter.classList.remove("hidden");
  showCard(index);
});

intro2.addEventListener("click", () => {
  intro2.classList.add("hidden");
  cardsContainer.classList.remove("hidden");
  counter.classList.remove("hidden");
  showCard(index);
});

// ------------------ Show Card ------------------
function showCard(i) {
  if (i >= reasons.length) {
    showClosing();
    return;
  }

  const imgSrc = `images/${imageFiles[i]}`;
  const text = `${i + 1}. ${reasons[i]}`;
  const currentCard = activeCard === 1 ? card1 : card2;
  const nextCard = activeCard === 1 ? card2 : card1;

  nextCard.innerHTML = `
    <img src="${imgSrc}" alt="photo" style="width:100%;height:100%;object-fit:cover;">
    <div class="glow"></div>
    <div class="reason">${text}</div>
  `;

  nextCard.style.transition = "none";
  nextCard.style.transform = "translateX(100%) scale(0.9)";
  nextCard.style.opacity = "1";
  nextCard.style.zIndex = 2;
  currentCard.style.zIndex = 1;

  setTimeout(() => {
    currentCard.style.transition = "transform 0.6s ease, opacity 0.6s ease";
    nextCard.style.transition = "transform 0.6s ease, opacity 0.6s ease";
    currentCard.style.transform = "translateX(-120%) scale(0.8)";
    currentCard.style.opacity = "0";
    nextCard.style.transform = "translateX(0) scale(1)";
  }, 50);

  counter.textContent = `${i + 1} / ${reasons.length}`;
  exitBtn.style.display = i === reasons.length - 1 ? "inline-block" : "none";

  activeCard = activeCard === 1 ? 2 : 1;
}

// ------------------ Swipe Navigation ------------------
let startX = 0;
let endX = 0;

cardsContainer.addEventListener("touchstart", (e) => {
  startX = e.touches[0].clientX;
}, { passive: true });

cardsContainer.addEventListener("touchend", (e) => {
  endX = e.changedTouches[0].clientX;
  handleSwipe();
}, { passive: true });

function handleSwipe() {
  const diff = startX - endX;

  // Swipe threshold
  if (Math.abs(diff) < 40) return;

  if (diff > 0) {
    // Swipe left → next
    index++;
    if (index === 20) {
      // Switch to second intro
      cardsContainer.classList.add("hidden");
      counter.classList.add("hidden");
      intro2.classList.remove("hidden");
      return;
    }
    if (index < reasons.length) {
      showCard(index);
    } else {
      // End → secret note
      showClosing();
    }
  } else {
    // Swipe right → previous
    if (index > 0) {
      index--;
      showCard(index);
    }
  }
}

// ------------------ Exit Button ------------------
exitBtn.addEventListener("click", showClosing);

// ------------------ Closing Screen ------------------
function showClosing() {

  // Hide everything else
  cardsContainer.classList.add("hidden");
  counter.classList.add("hidden");
  exitBtn.classList.add("hidden");
  card1.style.display = "none";
  card2.style.display = "none";

  // Show closing screen properly
  closingScreen.classList.remove("hidden");
  closingScreen.style.display = "flex";
  closingScreen.style.flexDirection = "column";
  closingScreen.style.justifyContent = "center";
  closingScreen.style.alignItems = "center";
  closingScreen.style.zIndex = "9999";

  // Set final secret message
  closingScreen.innerHTML = `
  <h1>💌 My Secret Note 💌</h1>
  <p><strong>20</strong> — A rare number of warmth, care, and emotional depth. It symbolizes the soul that loves softly yet completely. 🌸</p>
    <p><strong>13</strong> — A rare number of transformation, hidden power, and untamed mystery. 🔥</p>
  <p>When <strong>20</strong> joins <strong>13</strong>, their energies combine to form <strong>33</strong> — a number where warmth meets mystery, and love reaches its highest harmony. ✨</p>

  <p><strong>33</strong> — the Master Number of unconditional love, compassion, and divine harmony — where hearts align beyond reason. 💫</p>
  <p>That’s why I love you in <strong>33 different ways</strong> — each one a vibration of that eternal connection we share. 💖</p>
`;

}

