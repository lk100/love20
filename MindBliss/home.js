document.addEventListener("DOMContentLoaded", () => {
  const apiKey = "7993c3d8-0a6b-4e47-b296-5a6b45fee98f"; // Your Guardian API key
  const apiUrl = `https://content.guardianapis.com/search?q=psychology%20OR%20mental%20well-being%20OR%20exercise%20OR%20diet&api-key=${apiKey}&page-size=10&show-fields=trailText,headline,webUrl`;

  const blogContainer = document.querySelector(".fe-blog");
  const loader = document.querySelector(".loader");

  // Function to fetch blogs from The Guardian API
  function fetchBlogs() {
      loader.style.display = "block"; // Show the loader
      blogContainer.innerHTML = ""; // Clear previous blogs
      fetch(apiUrl)
          .then(response => {
              if (!response.ok) {
                  throw new Error("Failed to fetch blogs");
              }
              return response.json();
          })
          .then(data => {
              const articles = data.response.results;
              if (articles.length > 0) {
                  displayBlogs(articles);
              } else {
                  blogContainer.innerHTML = `<p>No articles found. Please try again later.</p>`;
              }
          })
          .catch(error => {
              console.error("Error fetching blogs:", error);
              blogContainer.innerHTML = `<p>Failed to load blogs. Please try again later.</p>`;
          })
          .finally(() => {
              loader.style.display = "none"; // Hide the loader
          });
  }

  // Function to display blogs
  function displayBlogs(articles) {
      blogContainer.innerHTML = ""; // Clear previous blogs
      articles.forEach(article => {
          const blogCard = document.createElement("div");
          blogCard.className = "blog-card";

          blogCard.innerHTML = `
              <h3><a href="${article.webUrl}" target="_blank">${article.fields.headline}</a></h3>
              <p>${article.fields.trailText || "No description available."}</p>
          `;

          blogContainer.appendChild(blogCard);
      });
  }

  // Fetch blogs on page load
  fetchBlogs();
});

// OpenWeather API Key and Base URL
// OpenWeather API Key and Base URL
// OpenWeather API Key and Base URL
// OpenWeather API Key and Base URL
const moodSuggestions = {
    clear: [
      "Enjoy a walk in the park to absorb the sunshine.",
      "Perfect time for some outdoor yoga.",
      "A great day to take on new projects with energy.",
      "Why not meditate and enjoy the peaceful surroundings?",
      "Spend some quality time reading your favorite book."
    ],
    clouds: [
      "A calm day to reflect and focus on mindfulness.",
      "Take a moment for breathing exercises.",
      "Read or write in a journal to center yourself.",
      "Meditation would be perfect for cloudy weather.",
      "Embrace a quiet day indoors and focus on inner peace."
    ],
    rain: [
      "Cozy up with a warm drink and relax.",
      "Enjoy indoor activities like listening to calming music.",
      "Take a mindfulness break, even if it's rainy outside.",
      "Do some light stretching or yoga indoors.",
      "Stay active with an indoor workout or meditation session."
    ],
    snow: [
      "Embrace the calmness of the snow and meditate.",
      "Perfect weather for a cozy day with a good book.",
      "Enjoy some indoor hobbies or creative activities.",
      "Breathe deeply and enjoy the serenity of winter.",
      "Take time to reflect on the year ahead."
    ],
    default: [
      "Stay positive and embrace the present moment.",
      "It's a great time for personal reflection.",
      "Remember to practice gratitude today.",
      "Take a break and appreciate the simple things.",
      "Stay mindful and grounded throughout the day."
    ]
  };
  
  const apiKey = '0d729c69d4da16cfe31a08b7f66f38cd'; // Replace with your actual API key
  const baseURL = 'https://api.openweathermap.org/data/2.5/weather';
  
  async function fetchWeatherByLocation(lat, lon) {
    const url = `${baseURL}?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
  
    try {
      const response = await fetch(url);
  
      // Check if the response is okay (status code 200)
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
  
      const data = await response.json();
      console.log('Weather data:', data); // Log weather data for debugging
  
      const weatherCondition = data.weather[0].main.toLowerCase(); // e.g., 'clear', 'clouds', 'rain'
      const temperature = data.main.temp; // Temperature in Celsius
      const location = data.name; // City name
  
      // Select a random suggestion from the corresponding weather condition
      const suggestionsArray = moodSuggestions[weatherCondition] || moodSuggestions.default;
      const randomSuggestion = suggestionsArray[Math.floor(Math.random() * suggestionsArray.length)];
  
      // Update the widget content
      const weatherText = `
        <strong>${temperature}°C - ${location}</strong><br>
        <em>${weatherCondition.charAt(0).toUpperCase() + weatherCondition.slice(1)}</em><br>
        ${randomSuggestion}
      `;
      document.getElementById('weather-text').innerHTML = weatherText;
  
      // Set an interval to update the suggestion every 10 seconds (or whatever interval you prefer)
      setInterval(() => {
        const newRandomSuggestion = suggestionsArray[Math.floor(Math.random() * suggestionsArray.length)];
        document.getElementById('weather-text').innerHTML = weatherText.replace(randomSuggestion, newRandomSuggestion);
      }, 10000); // Update every 10 seconds
  
    } catch (error) {
      console.error('Error fetching weather data:', error);
      document.getElementById('weather-text').innerHTML = `Error: ${error.message}`;
    }
  }
  
  function getUserLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          fetchWeatherByLocation(latitude, longitude);
        },
        (error) => {
          console.error('Error getting location:', error);
          document.getElementById('weather-text').innerHTML = 'Unable to fetch location.';
        }
      );
    } else {
      document.getElementById('weather-text').innerHTML = 'Geolocation not supported.';
    }
  }
  
  getUserLocation();
  