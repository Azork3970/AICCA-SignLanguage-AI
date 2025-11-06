const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const authRoutes = require('./routes/auth');
const dataRoutes = require('./routes/data');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'khang12345',
  database: process.env.DB_NAME || 'sign_language_db',
};

let db;
(async () => {
  try {
    db = await mysql.createConnection(dbConfig);
    console.log('Connected to MySQL database');
  } catch (error) {
    console.error('Database connection failed:', error);
  }
})();

// Make db available in routes
app.use((req, res, next) => {
  req.db = db;
  next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/data', dataRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
