require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { authenticateToken } = require("./utilities");
const User = require("./models/user.model");
const Note = require("./models/note.model");
const cookieParser = require('cookie-parser');
// Mongoose connection with error handling
mongoose
  .connect(process.env.connectionString, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Could not connect to MongoDB", err);
    process.exit(1); // Exit the process if connection fails
  });

const app = express();

app.use(express.json());

app.use(
  cors({
    origin: "*",
  })
);

app.get("/", (req, res) => {
  res.json({ data: "hello" });
});

app.use(cookieParser());

app.post('/logout', (req, res) => {
  res.clearCookie('token'); // Clear the cookie containing the JWT token
  res.status(200).send('Logged out successfully');
});

app.post("/create-account", async (req, res) => {
  const { fullName, email, password } = req.body;

  if (!fullName) {
    return res
      .status(400)
      .json({ error: true, message: "Full Name is required" });
  }

  if (!email) {
    return res.status(400).json({ error: true, message: "Email is required" });
  }

  if (!password) {
    return res
      .status(400)
      .json({ error: true, message: "Password is required" });
  }

  try {
    const isUser = await User.findOne({ email: email });

    if (isUser) {
      return res.json({
        error: true,
        message: "User already exists",
      });
    }

    const user = new User({
      fullName,
      email,
      password,
    });

    await user.save();

    const accessToken = jwt.sign(
      { user: user._id },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: "36000m",
      }
    );

    return res.json({
      error: false,
      user,
      accessToken,
      message: "Registration Successful",
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return res
      .status(500)
      .json({ error: true, message: "Failed to create user" });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  if (!password) {
    return res.status(400).json({ message: "Password is required" });
  }

  const userInfo = await User.findOne({ email: email });

  if (!userInfo) {
    return res.status(400).json({ message: "User not found" });
  }

  if (userInfo.email == email && userInfo.password == password) {
    const user = { user: userInfo };
    const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "36000m",
    });
    return res.json({
      error: false,
      message: "Login Successful",
      email,
      accessToken,
    });
  } else {
    return res.status(400).json({
      error: true,
      message: "Invalid Credentials",
    });
  }
});

app.post("/add-note", authenticateToken, async (req, res) => {
  const { title, content, tags } = req.body;
  const { user } = req.user;

  if (!title) {
    return res.status(400).json({
      error: true,
      message: "Title is required",
    });
  }

  if (!content) {
    return res.status(400).json({
      error: true,
      message: "Content is required",
    });
  }

  try {
    const note = new Note({
      title,
      content,
      tags: tags || [],
      userId: user._id,
    });
    await note.save();

    return res.json({
      error: false,
      note,
      message: "Note added successfully",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Internal Server Error",
    });
  }
});

app.put("/edit-note/:noteId", authenticateToken, async (req, res) => {
  const noteId = req.params.noteId;
  const { title, content, tags, isPinned } = req.body;
  const { user } = req.user;

  if (!title && !content && !tags) {
    return res.status(400).json({
      error: true,
      message: "No changes provided",
    });
  }

  try {
    const note = await Note.findOne({ _id: noteId, userId: user._id });

    if (!note) {
      return res.status(404).json({
        error: true,
        message: "Note not found",
      });
    }
    if (title) note.title = title;
    if (content) note.content = content;
    if (tags) note.tags = tags;
    if (isPinned) note.isPinned = isPinned;

    await note.save();

    return res.json({
      error: false,
      note,
      message: "Note updated successfully",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Internal Server Error",
    });
  }
});

app.get("/get-user", authenticateToken, async (req, res) => {
  try {
    console.log("Authenticated user:", req.user);
    const user = req.user;
    const isUser = await User.findById(user._id);

    if (!isUser) {
      return res.sendStatus(401);
    }

    return res.json({
      user: {
        fullName: isUser.fullName,
        email: isUser.email,
        _id: isUser._id,
        createdOn: isUser.createdOn,
      },
      message: "",
    });
  } catch (error) {
    console.error("Error in /get-user:", error);
    return res.status(500).json({ error: true, message: "Internal Server Error" });
  }
});

app.get("/get-all-notes", authenticateToken, async (req, res) => {
  try {
    console.log("Authenticated user:", req.user);
    const user = req.user;

    const notes = await Note.find({ userId: user._id }).sort({ isPinned: -1 });
    return res.json({
      error: false,
      notes,
      message: "All notes retrieved successfully",
    });
  } catch (error) {
    console.error("Error in /get-all-notes:", error);
    return res.status(500).json({ error: true, message: "Internal Server Error" });
  }
});

app.delete("/delete-note/:noteId", authenticateToken, async (req, res) => {
  const noteId = req.params.noteId;
  const { user } = req.user;

  try {
    const note = await Note.findOne({
      _id: noteId,
      userId: user._id,
    });
    if (!note) {
      return res.status(404).json({
        error: true,
        message: "Note not Found",
      });
    }
    await Note.deleteOne({
      _id: noteId,
      userId: user._id,
    });
    return res.json({
      error: false,
      message: "Note deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Internal Server Error",
    });
  }
});

app.put("/update-note-pinned/:noteId", authenticateToken, async (req, res) => {
  const noteId = req.params.noteId;
  const { isPinned } = req.body;
  const { user } = req.user;

  try {
    const note = await Note.findOne({ _id: noteId, userId: user._id });

    if (!note) {
      return res.status(404).json({
        error: true,
        message: "Note not found",
      });
    }

    if (isPinned) note.isPinned = isPinned || false;

    await note.save();

    return res.json({
      error: false,
      note,
      message: "Note updated successfully",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Internal Server Error",
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res
    .status(500)
    .json({ error: true, message: "An unexpected error occurred" });
});

app.get("/search-notes/", authenticateToken, async (req, res) => {
  const { user } = req.user;
  const { query } = req.query;
  if (!query) {
    return res.status(400).json({
      error: true,
      message: "Search query is required",
    });
  }

  try {
    const matchingNotes = await Note.find({
      userId: user._id,
      $or: [
        {
          title: { $regex: new RegExp(query, "i") },
        },
        {
          content: { $regex: new RegExp(query, "i") },
        },
      ],
    });

    return res.json({
      error: false,
      notes: matchingNotes,
      message: "Notes matching the search query retirved successfully",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Internal Server Error",
    });
  }
});

app.listen(8000, () => {
  console.log("Server running on port 8000");
});

module.exports = app;
