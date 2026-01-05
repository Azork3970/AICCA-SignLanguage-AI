const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { createTableQuery, insertSignDataQuery, getSignDataByUserQuery, getAllSignDataQuery } = require('../models/SignData');
const { body, validationResult } = require('express-validator');
const winston = require('winston');
const multer = require('multer');
const path = require('path');
const router = express.Router();

// Security logger for data operations
const dataLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'data-security.log' }),
    new winston.transports.Console()
  ]
});

// Multer configuration for video uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed!'), false);
    }
  }
});

// Middleware to attach db to req
router.use((req, res, next) => {
  req.db = global.db;
  next();
});

// Initialize database table
router.use(async (req, res, next) => {
  try {
    if (req.db) {
      await req.db.execute(createTableQuery);
    }
    next();
  } catch (error) {
    console.error('Error creating table:', error);
    next();
  }
});

// Get sign data for logged-in user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [rows] = await req.db.execute(getSignDataByUserQuery, [req.user.userId]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch sign data', error: error.message });
  }
});

// Add new sign data
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { id, username, createdAt, signsPerformed, secondsSpent } = req.body;
    const userId = req.user.userId;

    await req.db.execute(insertSignDataQuery, [
      id,
      userId,
      username,
      new Date(createdAt),
      JSON.stringify(signsPerformed),
      secondsSpent,
    ]);

    res.status(201).json({ message: 'Sign data added successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add sign data', error: error.message });
  }
});

// Get top users (leaderboard)
router.get('/top-users', async (req, res) => {
  try {
    const [rows] = await req.db.execute(getAllSignDataQuery);

    // Group by username and calculate total signs
    const userStats = {};
    rows.forEach(row => {
      const signsCount = row.signsPerformed.reduce((acc, sign) => acc + sign.count, 0);
      if (!userStats[row.username] || userStats[row.username].signsCount < signsCount) {
        userStats[row.username] = {
          username: row.username,
          signsCount: signsCount,
        };
      }
    });

    // Sort and get top 3
    const topUsers = Object.values(userStats)
      .sort((a, b) => b.signsCount - a.signsCount)
      .slice(0, 3)
      .map((user, index) => ({
        username: user.username,
        rank: index + 1,
      }));

    res.json(topUsers);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch top users', error: error.message });
  }
});

// Video upload endpoint
router.post('/upload-video', authenticateToken, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No video file provided' });
    }

    const videoPath = req.file.path;
    const userId = req.user.userId;

    // Log the upload
    dataLogger.info(`Video uploaded by user ${userId}: ${req.file.filename}`);

    res.status(200).json({
      message: 'Video uploaded successfully',
      filename: req.file.filename,
      path: videoPath,
      size: req.file.size
    });
  } catch (error) {
    dataLogger.error(`Video upload error: ${error.message}`);
    res.status(500).json({ message: 'Failed to upload video', error: error.message });
  }
});

module.exports = router;
