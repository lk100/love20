import express from "express";
import mysql from "mysql2";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { exec } from "child_process";
import jwt from "jsonwebtoken";
import { fileURLToPath } from "url";
import expressSession from "express-session";

dotenv.config();
const SECRET_KEY = "lovekhanna";
// Resolve __dirname equivalent in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;
app.use(express.static(path.join(__dirname))); 
app.use(express.json());
app.use(cors());
// Use session middleware

// Use session middleware
app.use(
  expressSession({
    secret: "lovekhanna", // Secret to sign the session ID cookie
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Use true if you're using https
  })
);
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent";

// MySQL connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) {
        console.error('Failed to connect to database:', err);
    } else {
        console.log('Connected to MySQL database');
    }
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
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'home.html'));  // Assuming index.html is in the root
});
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

function formatResponse(response) {
  // Format the response into a conversational style
  const points = response
    .split(". ")
    .filter((sentence) => sentence.trim() !== "");
  return points.map((point) => `<p>${point.trim()}.</p>`).join("");
}
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

app.post("/submit-journal", (req, res) => {
  const userText = req.body.text;
  const userId = req.body.user_id;
  console.log("User journal text:", userText);
exec(`python predict.py "${userText.replace(/"/g, '\\"')}"`, (error, stdout, stderr) => {
    if (error) {
      console.error("Error running Python script:", error);
      return res.status(500).json({ error: "Failed to process mood prediction" });
    }

    console.log("Python stdout:", stdout);

    try {
      const result = JSON.parse(stdout.trim()); // <-- small fix: .trim()
      
      if (result.error) {
        console.error("Python script error:", result.error);
        return res.status(500).json({ error: "Error predicting emotion" });
      }

      const predictedEmotion = result.predicted_emotion;
      console.log("Predicted emotion:", predictedEmotion);

      const query = `INSERT INTO moods (user_id, journal_text, predicted_emotion) VALUES (?, ?, ?)`;
      db.query(query, [userId, userText, predictedEmotion], (dbError, dbResults) => {
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
      });
    } catch (parseError) {
      console.error("Failed to parse Python output:", parseError);
      return res.status(500).json({ error: "Invalid prediction output" });
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
  const limit = parseInt(req.query.limit) || 10;
  const offset = parseInt(req.query.offset) || 0;

  const query = `
      SELECT journal_text, predicted_emotion, created_at 
      FROM moods
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

  db.query(query, [userId, limit, offset], (err, results) => {
    if (err) {
      console.error("Error fetching journal entries:", err);
      return res.status(500).json({ message: "Server error" });
    }

    res.json(results);
  });
});
app.get("/get-latest-emotion", (req, res) => {
  const userId = req.query.user_id; // Get the user ID from the query parameters

  const sql =
    "SELECT predicted_emotion FROM moods WHERE user_id = ? ORDER BY created_at DESC LIMIT 1";
  db.query(sql, [userId], (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    if (result.length > 0) {
      res.json({ emotion: result[0].predicted_emotion }); // Corrected here
    } else {
      res.json({ emotion: null });
    }
  });
});

// Open mood modal and render graph on user load
// ---------------------- 1️⃣ RECOMMEND USERS (COMPLEMENT) ----------------------
app.get("/recommend-users/:userId", (req, res) => {
  const userId = req.params.userId;

  console.log(`🔍 Fetching personality for user ID: ${userId}`);

  // Fetch the user's personality
  const personalityQuery = `SELECT personality FROM users WHERE id = ?`;

  db.query(personalityQuery, [userId], (err, personalityResult) => {
    if (err) {
      console.error("❌ Error fetching personality:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (personalityResult.length === 0) {
      console.warn("⚠️ User not found in the database.");
      return res.status(404).json({ message: "User not found" });
    }

    const personality = personalityResult[0].personality;
    console.log(`✅ Found Personality: ${personality}`);

    // Fetch users with the same personality, excluding friends
    const recommendationQuery = `
    SELECT u.id, u.username
    FROM users u
    WHERE u.personality = ? 
      AND u.id != ? 
      AND u.id NOT IN (
          SELECT IF(f.sender_id = ?, f.receiver_id, f.sender_id) 
          FROM friend_requests f
          WHERE f.status = 'accepted'
          AND (f.sender_id = ? OR f.receiver_id = ?)
      )
`;

    db.query(
      recommendationQuery,
      [personality, userId, userId, userId, userId, userId],
      (err, userResults) => {
        if (err) {
          console.error("❌ Error fetching recommended users:", err);
          return res.status(500).json({ error: "Database error" });
        }

        console.log(`🔍 Found recommended users:`, userResults);

        if (userResults.length === 0) {
          console.warn("⚠️ No recommended users found.");
        }

        res.status(200).json({ recommended_users: userResults });
      }
    );
  });
});

// ---------------------- 2️⃣ SEND FRIEND REQUEST ----------------------

app.post("/send-friend-request", (req, res) => {
  const { senderId, receiverId } = req.body;

  if (!senderId || !receiverId) {
    return res
      .status(400)
      .json({ error: "Both senderId and receiverId are required" });
  }

  // Check if a request already exists from receiver to sender
  const checkReverseQuery = `
      SELECT * FROM friend_requests 
      WHERE sender_id = ? AND receiver_id = ? AND status = 'pending'
  `;

  db.query(
    checkReverseQuery,
    [receiverId, senderId],
    (err, existingReverseRequest) => {
      if (err) {
        console.error("Error checking reverse friend request:", err);
        return res.status(500).json({ error: "Database error" });
      }

      // If a request exists, prevent sending another request
      if (existingReverseRequest.length > 0) {
        return res.status(400).json({
          message: "User has already sent a request. Add Friend Back instead.",
        });
      }

      // Check if a request already exists from sender to receiver
      const checkQuery = `
          SELECT * FROM friend_requests 
          WHERE sender_id = ? AND receiver_id = ? AND status = 'pending'
      `;

      db.query(checkQuery, [senderId, receiverId], (err, existingRequest) => {
        if (err) {
          console.error("Error checking friend request:", err);
          return res.status(500).json({ error: "Database error" });
        }

        if (existingRequest.length > 0) {
          return res
            .status(400)
            .json({ message: "Friend request already sent" });
        }

        // Insert the friend request
        const insertQuery = `
              INSERT INTO friend_requests (sender_id, receiver_id, status) 
              VALUES (?, ?, 'pending')
          `;

        db.query(insertQuery, [senderId, receiverId], (err, result) => {
          if (err) {
            console.error("Error sending friend request:", err);
            return res.status(500).json({ error: "Database error" });
          }

          res.status(201).json({ message: "Friend request sent successfully" });
        });
      });
    }
  );
});

app.get("/received-friend-requests/:userId", (req, res) => {
  const userId = req.params.userId;

  const query = `
      SELECT fr.id, u.username AS sender_name, fr.status
      FROM friend_requests fr
      JOIN users u ON fr.sender_id = u.id
      WHERE fr.receiver_id = ? AND fr.status = 'pending'
  `;

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error("Error fetching friend requests:", err);
      return res.status(500).json({ error: "Database error" });
    }

    res.status(200).json(results);
  });
});

app.post("/accept-friend-request", (req, res) => {
  const { requestId } = req.body;

  if (!requestId) {
    return res.status(400).json({ error: "Request ID is required" });
  }

  const updateQuery = `
      UPDATE friend_requests 
      SET status = 'accepted' 
      WHERE id = ?
  `;

  db.query(updateQuery, [requestId], (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    res.json({ message: "Friend request accepted successfully" });
  });
});

app.get("/most-occurring-emotion/:userId", (req, res) => {
  const userId = req.params.userId;

  // Query to find the most occurring emotion for a user
  const query = `
    SELECT predicted_emotion, COUNT(predicted_emotion) AS count
    FROM moods
    WHERE user_id = ?
    GROUP BY predicted_emotion
    ORDER BY count DESC
    LIMIT 1
  `;

  db.query(query, [userId], (err, result) => {
    if (err) {
      console.error("Error fetching most occurring emotion:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (result.length > 0) {
      res
        .status(200)
        .json({ most_occurring_emotion: result[0].predicted_emotion });
    } else {
      res.status(404).json({ message: "No emotions recorded for this user." });
    }
  });
});

app.get("/get-friends/:userId", (req, res) => {
  const userId = req.params.userId;

  const query = `
      SELECT DISTINCT 
          CASE 
              WHEN f.sender_id = ? THEN u2.id
              ELSE u1.id
          END AS friend_id,
          CASE 
              WHEN f.sender_id = ? THEN u2.username
              ELSE u1.username
          END AS friend_name
      FROM friend_requests f
      JOIN users u1 ON f.sender_id = u1.id
      JOIN users u2 ON f.receiver_id = u2.id
      WHERE (f.sender_id = ? OR f.receiver_id = ?) 
      AND f.status = 'accepted'
  `;

  db.query(query, [userId, userId, userId, userId], (err, results) => {
    if (err) {
      console.error("Error fetching friends:", err);
      return res.status(500).json({ error: "Database error" });
    }

    res.status(200).json({ friends: results });
  });
});

app.post("/send-message", (req, res) => {
  const { senderId, receiverId, message } = req.body;

  if (!senderId || !receiverId || !message) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const query = `
      INSERT INTO messages (sender_id, receiver_id, message) 
      VALUES (?, ?, ?)
  `;

  db.query(query, [senderId, receiverId, message], (err, result) => {
    if (err) {
      console.error("Error sending message:", err);
      return res.status(500).json({ error: "Database error" });
    }

    res.status(201).json({ message: "Message sent successfully" });
  });
});

app.get("/get-messages/:senderId/:receiverId", (req, res) => {
  const { senderId, receiverId } = req.params;

  const query = `
      SELECT m.id, m.sender_id, u.username AS sender_name, 
             m.receiver_id, m.message, m.timestamp
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE (m.sender_id = ? AND m.receiver_id = ?) 
         OR (m.sender_id = ? AND m.receiver_id = ?)
      ORDER BY m.timestamp ASC
  `;

  db.query(
    query,
    [senderId, receiverId, receiverId, senderId],
    (err, results) => {
      if (err) {
        console.error("Error fetching messages:", err);
        return res.status(500).json({ error: "Database error" });
      }
      res.status(200).json({ messages: results });
    }
  );
});

const blacklist = new Set(); // Store invalidated tokens (optional)

// Logout endpoint
app.post("/logout", (req, res) => {
  const token = req.headers["authorization"]?.split(" ")[1]; // Extract token

  if (!token) {
    return res.status(400).json({ message: "No token provided" });
  }

  // Optionally blacklist the token
  blacklist.add(token);

  res.status(200).json({ message: "Logged out successfully" });
});

// Middleware to check if token is blacklisted (Optional)
const checkBlacklist = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (blacklist.has(token)) {
    return res.status(401).json({ message: "Token is invalid (logged out)" });
  }
  next();
};
// Apply this middleware to protected routes
app.use(checkBlacklist);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
