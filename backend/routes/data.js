const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { createTableQuery, insertSignDataQuery, getSignDataByUserQuery, getAllSignDataQuery } = require('../models/SignData');
const router = express.Router();

// Initialize database table
router.use(async (req, res, next) => {
  try {
    await req.db.execute(createTableQuery);
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

module.exports = router;
