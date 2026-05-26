const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const connectDB = require("./config/db");

dotenv.config();

// Connect MongoDB
connectDB();

const app = express();

// =========================
// Security Middleware
// =========================
app.use(helmet());

// =========================
// CORS Configuration
// =========================
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173"
];

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL.trim());
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
  })
);

// =========================
// Body Parser Middleware
// =========================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.url} - Body:`, req.body);
  res.on('finish', () => {
    console.log(`[RESPONSE] ${req.method} ${req.url} -> Status ${res.statusCode}`);
  });
  next();
});

// =========================
// Ensure Upload Folder Exists
// =========================
const uploadsPath = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath);
}

// Static Uploads Folder
app.use("/uploads", express.static(uploadsPath));

// =========================
// Test MongoDB Schema
// =========================
const TestSchema = new mongoose.Schema({
  name: String,
  email: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const TestUser = mongoose.model("TestUser", TestSchema);

// =========================
// API Routes
// =========================
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/files", require("./routes/fileRoutes"));
app.use("/api/activity", require("./routes/activityRoutes"));
app.use("/api/support", require("./routes/supportRoutes"));

// =========================
// Home Route
// =========================
app.get("/", (req, res) => {
  res.send("Cloud Storage Backend Running");
});

// =========================
// MongoDB Test Route
// =========================
app.get("/test-db", async (req, res) => {
  try {
    const user = await TestUser.create({
      name: "Abhishek",
      email: "abhi@gmail.com",
    });

    res.status(201).json({
      success: true,
      message: "Data inserted successfully",
      user,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// =========================
// Get All Test Data
// =========================
app.get("/all-users", async (req, res) => {
  try {
    const users = await TestUser.find();

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// =========================
// Error Handling Middleware
// =========================
app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Server Error",
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
});

// =========================
// Server Port
// =========================
const PORT = process.env.PORT || 5000;

// =========================
// Start Server
// =========================
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
server.timeout = 30 * 60 * 1000; // 30 minutes timeout for large file uploads
// Loaded Gemini AI configurations successfully

module.exports = app;