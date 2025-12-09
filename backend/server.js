const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const passport = require('passport');
const session = require('express-session');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
require('dotenv').config();

// Security logger setup
const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'sign-language-backend' },
  transports: [
    new winston.transports.File({ filename: 'security.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

const authRoutes = require('./routes/auth/auth.js');
const dataRoutes = require('./routes/data');

const app = express();
const PORT = process.env.PORT || 5000;

/* =======================
   🔥 CORS FIX – MUST BE FIRST
======================= */
app.use(cors({
  origin: 'http://localhost:3000', 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Allow preflight
app.options('*', cors());

/* =======================
   Security middleware
======================= */
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://accounts.google.com", "https://www.facebook.com", "http://localhost:3000"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    securityLogger.warn('Rate limit exceeded', {
      ip: req.ip,
      url: req.url,
      userAgent: req.get('User-Agent')
    });
    res.status(429).json({ message: 'Quá nhiều yêu cầu, vui lòng thử lại sau.' });
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Quá nhiều lần thử đăng nhập, vui lòng thử lại sau 15 phút.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    securityLogger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      url: req.url,
      userAgent: req.get('User-Agent')
    });
    res.status(429).json({ message: 'Quá nhiều lần thử đăng nhập, vui lòng thử lại sau.' });
  }
});

app.use('/auth/login', authLimiter);
app.use('/auth/register', authLimiter);
app.use('/auth/forgot-password', authLimiter);
app.use(limiter);

// HTTPS redirect (production)
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// SESSION
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false
}));

// Database
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

    global.db = db;

    require('./routes/auth/auth.js')(passport, db);

    app.use(passport.initialize());
    app.use(passport.session());

    app.use('/auth', authRoutes(passport, db));
    app.use('/data', dataRoutes);

  } catch (error) {
    console.error('Database connection failed:', error);
  }
})();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
