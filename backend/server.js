const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const passport = require('passport');
const session = require('express-session');
require('dotenv').config();

const authRoutes = require('./routes/auth/auth.js');

const dataRoutes = require('./routes/data');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// SESSION
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false
}));

// Prepare db
let db;
(async () => {
  try {
    db = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'khang12345',
      database: process.env.DB_NAME || 'sign_language_db',
    });

    console.log('DB connected');

    // Make db globally available
    global.db = db;

    // 1) LOAD PASSPORT CONFIG + PASS DB
    require('./routes/auth/auth.js')(passport, db);

    // 2) Initialize Passport after strategies loaded
    app.use(passport.initialize());
    app.use(passport.session());

    // 3) Setup routes after passport + db ready
    app.use('/auth', authRoutes(passport, db));
    app.use('/data', dataRoutes);

  } catch (error) {
    console.error('Database connection failed:', error);
  }
})();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
