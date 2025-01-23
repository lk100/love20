import express from "express";
import mysql from "mysql2";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { exec } from "child_process";
import jwt from "jsonwebtoken";
import { fileURLToPath } from "url";
import expressSession from 'express-session';


dotenv.config();
const SECRET_KEY='lovekhanna';
// Resolve __dirname equivalent in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express();
const PORT = 5000;

app.use(express.json());
app.use(cors());
// Use session middleware


// Use session middleware
app.use(
  expressSession({
    secret: 'lovekhanna',  // Secret to sign the session ID cookie
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }  // Use true if you're using https
  })
);
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent";

// MySQL connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "123456",
  database: "homepage",
});

db.connect((err) => {
  if (err) {
    console.error("Failed to connect to MySQL", err);
    return;
  }
  console.log("Connected to MySQL");
});

// Create user_answers table if not exists
db.query(
  `CREATE TABLE IF NOT EXISTS user_answers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      question_number VARCHAR(255) NOT NULL,
      answer TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`
);

// Create users table if not exists
db.query(
  `CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) NOT NULL UNIQUE,
      email VARCHAR(255) NOT NULL UNIQUE,
      personality VARCHAR(255) NOT NULL,
      password VARCHAR(255) NOT NULL
  )`
);

// Routes
app.post("/signup", (req, res) => {
  const { username, email, personality, password } = req.body;
  db.query(
    "INSERT INTO users (username, email, personality, password) VALUES (?, ?, ?, ?)",
    [username, email, personality, password],
    (err, result) => {
      if (err) {
        return res
          .status(500)
          .send({ message: "Error creating user", error: err });
      }
      res.status(201).send({ message: "User created successfully" });
    }
  );
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  db.query(
    "SELECT * FROM users WHERE username = ?",
    [username],
    (err, results) => {
      if (err)
        return res
          .status(500)
          .send({ message: "Error logging in", error: err });

      if (results.length === 0)
        return res.status(400).send({ message: "Invalid credentials" });

      const user = results[0];

      // Comparing hashed password (not plain-text)
      // If you’re not using bcrypt for password comparison, this is a security risk.
      if (user.password === password) {
        // Create a JWT token
        const token = jwt.sign(
          { userId: user.id, username: user.username },
          SECRET_KEY,
          { expiresIn: "1h" }
        );

        return res.status(200).json({ message: "Login successful", token });
      }

      return res.status(400).send({ message: "Invalid credentials" });
    }
  );
});

app.post("/verify-token", (req, res) => {
  const token = req.headers["authorization"]?.split(" ")[1]; // Extract token from Authorization header

  if (!token) {
      return res.status(401).json({ message: "Token missing" });
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
      if (err) {
          return res.status(401).json({ message: "Token is invalid or expired" });
      }

      // Return userId in the response
      res.status(200).json({ message: "Token is valid", user: decoded });
  });
});

const authenticateUser = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;
  const apiKey = process.env.GEMINI_API_KEY; // Ensure this is correctly loaded from .env

  if (!apiKey) {
    console.error("Google Gemini API key is missing");
    return res
      .status(500)
      .send({ message: "Google Gemini API key is missing" });
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  try {
    const result = await model.generateContent(userMessage);
    const formattedResponse = formatResponse(result.response.text());
    res.json({ message: formattedResponse });
  } catch (error) {
    // Log the error and send a response
    console.error("Backend error:", error);
    res
      .status(500)
      .json({ message: "Error processing your message", error: error.message });
  }
});

// Start the server
// Save answer to the database
app.post("/save-answer", (req, res) => {
  const { question_number, answer } = req.body;
  console.log("Received data:", question_number, answer); // Log the received data
  const token = req.headers["authorization"]?.split(" ")[1]; // Get token from Authorization header

  if (!token) {
    return res.status(401).json({ message: "Token missing" });
  }

  // Verify token and extract user ID
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    const userId = decoded.userId; // Extract user ID from the token

    // SQL query to save the answer to the database with the unique user ID
    const sql =
      "INSERT INTO user_answers (user_id, question_number, answer) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE answer = VALUES(answer)";

    db.query(sql, [userId, question_number, answer], (err, result) => {
      if (err) {
        console.error("Error saving answer:", err);
        return res.status(500).json({ message: "Error saving answer" });
      }
      console.log("Answer saved:", result); // Log the result
      res.status(200).json({ message: "Answer saved successfully" });
    });
  });
});

app.post("/complete-quiz", (req, res) => {
  // Your logic for handling the POST request
  res.status(200).json({ message: "Quiz completed successfully!" });
});

app.post("/submit-quiz", (req, res) => {
  const token = req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Token missing" });
  }

  // Verify token and extract user ID
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    const userId = decoded.userId; // Extract user ID from the token

    // Calculate the aggregate score by summing up the answers from user_answers
    const calculateAggregateSQL = `
            SELECT SUM(answer) AS aggregate_score 
            FROM user_answers 
            WHERE user_id = ? 
        `;

    db.query(calculateAggregateSQL, [userId], (err, result) => {
      if (err) {
        console.error("Error calculating aggregate score:", err);
        return res
          .status(500)
          .json({ message: "Error calculating aggregate score" });
      }

      const aggregateScore = result[0].aggregate_score;

      // Insert or update the aggregate score in user_scores
      const saveScoreSQL = `
                INSERT INTO user_scores (user_id, aggregate_score) 
                VALUES (?, ?) 
                ON DUPLICATE KEY UPDATE aggregate_score = VALUES(aggregate_score)
            `;

      db.query(saveScoreSQL, [userId, aggregateScore], (err, result) => {
        if (err) {
          console.error("Error saving aggregate score:", err);
          return res
            .status(500)
            .json({ message: "Error saving aggregate score" });
        }

        res.status(200).json({
          message: "Quiz submitted successfully",
          aggregate_score: aggregateScore,
        });
      });
    });
  });
});

app.get("/get-scores", (req, res) => {
  const token = req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Token missing" });
  }

  // Verify token and extract user ID
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    const userId = decoded.userId; // Extract user ID from token

    // Query to get user's aggregate score and creation date from user_scores table
    const getScoresSQL = `
            SELECT aggregate_score, created_at
            FROM user_scores 
            WHERE user_id = ?
            ORDER BY created_at`;

    db.query(getScoresSQL, [userId], (err, result) => {
      if (err) {
        console.error("Error fetching scores:", err);
        return res.status(500).json({ message: "Error fetching scores" });
      }

      res.status(200).json(result); // Return scores with creation date
    });
  });
});

function formatResponse(response) {
  // Format the response into a conversational style
  const points = response
    .split(". ")
    .filter((sentence) => sentence.trim() !== "");
  return points.map((point) => `<p>${point.trim()}.</p>`).join("");
}
app.post("/submit-journal", (req, res) => {
  const userText = req.body.text;
  const userId = req.body.user_id;
  console.log("User journal text:", userText);
  exec(`python predict.py "${userText}"`, (error, stdout, stderr) => {
    if (error) {
      console.error("Error running Python script:", error);
      return res
        .status(500)
        .json({ error: "Failed to process mood prediction" });
    }
    console.log("Python stdout:", stdout);
    try {
      const result = JSON.parse(stdout);
      if (result.error) {
        console.error("Python script error:", result.error);
        return res.status(500).json({ error: "Error predicting emotion" });
      }
      const predictedEmotion = result.predicted_emotion;
      console.log("Predicted emotion:", predictedEmotion);
      const query = `INSERT INTO moods (user_id, journal_text, predicted_emotion) VALUES (?, ?, ?)`;
      db.query(
        query,
        [userId, userText, predictedEmotion],
        (dbError, dbResults) => {
          if (dbError) {
            console.error("Error saving to database:", dbError);
            return res.status(500).json({ error: "Database error" });
          }
          console.log("Saved to database:", dbResults);
          return res.status(200).json({
            success: true,
            emotion: predictedEmotion,
            id: dbResults.insertId,
          });
        }
      );
    } catch (parseError) {
      console.error("Failed to parse Python response:", parseError);
      return res.status(500).json({ error: "Failed to parse response" });
    }
  });
});
app.get("/mood-history/:userId", (req, res) => {
  const userId = req.params.userId;
  const graphType = req.query.type || "date-emotion";

  if (graphType === "date-emotion") {
    // Fetch the last 10 entries, sorted by created_at in descending order
    db.query(
      "SELECT journal_text, predicted_emotion, created_at FROM moods WHERE user_id = ? ORDER BY created_at DESC LIMIT 10",
      [userId],
      (error, results) => {
        if (error) {
          console.error("Error fetching mood history:", error);
          res.status(500).json({ error: "Failed to fetch mood history" });
        } else {
          res.status(200).json(results);
        }
      }
    );
  } else if (graphType === "pie-chart") {
    // Fetch the mood data and count frequencies of each emotion
    db.query(
      "SELECT predicted_emotion FROM moods WHERE user_id = ?",
      [userId],
      (error, results) => {
        if (error) {
          console.error("Error fetching mood history:", error);
          res.status(500).json({ error: "Failed to fetch mood history" });
        } else {
          // Calculate the frequency of each emotion
          const emotionCounts = {
            anger: 0,
            fear: 0,
            joy: 0,
            sadness: 0,
            surprise: 0,
            // Add other emotions here if necessary
          };

          results.forEach((mood) => {
            const emotion = mood.predicted_emotion;
            if (emotionCounts.hasOwnProperty(emotion)) {
              emotionCounts[emotion]++;
            }
          });

          res.status(200).json(emotionCounts);
        }
      }
    );
  } else {
    // Handle unsupported graph types
    res.status(400).json({ error: "Unsupported graph type" });
  }
});
// Example of Express.js route to fetch journal data
app.get("/get-journal/:userId", (req, res) => {
  const userId = req.params.userId;

  const query = `
      SELECT text, predicted_emotion, created_at 
      FROM user_journal
      WHERE user_id = ?
      ORDER BY created_at DESC
    `;

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error("Error fetching journal entries:", err);
      return res.status(500).json({ message: "Server error" });
    }

    res.json(results); // Send journal entries as JSON
  });
}); 

// Open mood modal and render graph on user load
function openMoodModal() {
  document.getElementById("mood-modal").style.display = "block";
  fetchMoodHistory();
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
