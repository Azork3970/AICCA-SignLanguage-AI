const express = require('express');
const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET || 'default_secret_key_change_in_production';
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { body, validationResult } = require('express-validator');
const winston = require('winston');

const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;

// Security logger
const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'auth-security.log' }),
    new winston.transports.Console()
  ]
});

module.exports = (passport, db) => {
  const router = express.Router();

  // -------------------------
  // PASSPORT GOOGLE STRATEGY
  // -------------------------
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.BASE_URL}/auth/google/callback`
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const [existingUsers] = await db.execute(
        "SELECT * FROM users WHERE provider_id = ? AND provider = 'google'",
        [profile.id]
      );

      let user;
      if (existingUsers.length === 0) {
        const userId = crypto.randomUUID();
        await db.execute(
          "INSERT INTO users (id, name, email, provider, provider_id, photo_url, created_at, last_login) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())",
          [
            userId,
            profile.displayName,
            profile.emails && profile.emails[0] ? profile.emails[0].value : `${profile.id}@google.com`,
            'google',
            profile.id,
            profile.photos && profile.photos[0] ? profile.photos[0].value : null
          ]
        );

        user = { id: userId, name: profile.displayName, email: profile.emails && profile.emails[0] ? profile.emails[0].value : null };
      } else {
        user = existingUsers[0];
      }

      return done(null, user);
    } catch (err) {
      securityLogger.error('Google strategy error', { error: err.message });
      return done(err, null);
    }
  }));

  // -------------------------
  // FACEBOOK STRATEGY
  // -------------------------
  passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: `${process.env.BASE_URL}/auth/facebook/callback`,
    profileFields: ['id', 'displayName', 'photos', 'email']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email =
        profile.emails && profile.emails.length > 0
          ? profile.emails[0].value
          : `${profile.id}@facebook.com`;

      const photo =
        profile.photos && profile.photos.length > 0
          ? profile.photos[0].value
          : null;

      const [existingUsers] = await db.execute(
        "SELECT * FROM users WHERE provider_id = ? AND provider = 'facebook'",
        [profile.id]
      );

      let user;
      if (existingUsers.length === 0) {
        const userId = crypto.randomUUID();

        await db.execute(
          "INSERT INTO users (id, name, email, provider, provider_id, photo_url, created_at, last_login) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())",
          [
            userId,
            profile.displayName,
            email,
            'facebook',
            profile.id,
            photo
          ]
        );

        user = { id: userId, name: profile.displayName, email };
      } else {
        user = existingUsers[0];
      }

      return done(null, user);

    } catch (err) {
      securityLogger.error('Facebook strategy error', { error: err.message });
      return done(err, null);
    }
  }));

  // SESSION
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const [rows] = await db.execute("SELECT * FROM users WHERE id = ?", [id]);
      done(null, rows[0] || null);
    } catch (err) {
      done(err, null);
    }
  });

  // -------------------------
  // Helper: password validation
  // -------------------------
  const validatePasswordStrength = (password) => {
    const errors = [];
    if (!password || password.length < 8) errors.push('Mật khẩu phải có ít nhất 8 ký tự');
    if (!/[A-Z]/.test(password)) errors.push('Mật khẩu phải chứa ít nhất 1 chữ hoa');
    if (!/[a-z]/.test(password)) errors.push('Mật khẩu phải chứa ít nhất 1 chữ thường');
    if (!/\d/.test(password)) errors.push('Mật khẩu phải chứa ít nhất 1 số');
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) errors.push('Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt');
    return errors;
  };

  // -------------------------
  // Helper: Create Nodemailer transporter
  // -------------------------
  function createTransporter() {
    // If EMAIL_USER & EMAIL_PASS provided, use them (supports Gmail/SMTP)
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      // If using Gmail, user may need to set app password or allow less secure apps
      return nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
    }

    // Fallback: return null (we'll log the link instead)
    return null;
  }

  async function sendResetEmail(toEmail, resetLink) {
    const transporter = createTransporter();
    if (transporter) {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: toEmail,
        subject: 'Password Reset Request',
        html: `
          <h2>Password Reset</h2>
          <p>Click the link below to reset your password (expires in 1 hour):</p>
          <a href="${resetLink}">${resetLink}</a>
        `
      };

      await transporter.sendMail(mailOptions);
      securityLogger.info('Password reset email sent', { to: toEmail });
    } else {
      // Log link for local testing
      securityLogger.warn('Email transporter not configured - logging reset link', { to: toEmail, resetLink });
      console.log(`🔗 Password reset link for ${toEmail}: ${resetLink}`);
    }
  }

  // -------------------------
  // AUTH ROUTES
  // -------------------------

  // REGISTER
  router.post('/register', [
    body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Tên phải từ 2-50 ký tự'),
    body('email').isEmail().normalizeEmail().withMessage('Email không hợp lệ'),
    body('password').isLength({ min: 8 }).withMessage('Mật khẩu phải có ít nhất 8 ký tự')
  ], async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        securityLogger.warn('Registration validation failed', {
          ip: req.ip,
          errors: errors.array(),
          userAgent: req.get('User-Agent')
        });
        return res.status(400).json({ message: "Dữ liệu không hợp lệ", errors: errors.array() });
      }

      const { name, email, password } = req.body;

      const passwordErrors = validatePasswordStrength(password);
      if (passwordErrors.length > 0) {
        securityLogger.warn('Weak password registration attempt', {
          ip: req.ip,
          email,
          errors: passwordErrors
        });
        return res.status(400).json({ message: "Mật khẩu không đủ mạnh", errors: passwordErrors });
      }

      const [exists] = await db.execute("SELECT * FROM users WHERE email = ?", [email]);
      if (exists.length > 0) {
        securityLogger.warn('Registration attempt with existing email', {
          ip: req.ip,
          email
        });
        return res.status(400).json({ message: "Email đã được sử dụng" });
      }

      const hash = await bcrypt.hash(password, 12);
      const id = crypto.randomUUID();

      await db.execute(
        "INSERT INTO users (id, name, email, password, provider, created_at, last_login) VALUES (?, ?, ?, ?, 'local', NOW(), NOW())",
        [id, name, email, hash]
      );

      securityLogger.info('User registered successfully', {
        userId: id,
        email,
        ip: req.ip
      });

      res.json({ message: "Đăng ký thành công!" });

    } catch (err) {
      securityLogger.error('Registration error', {
        error: err.message,
        ip: req.ip,
        email: req.body ? req.body.email : undefined
      });
      res.status(500).json({ message: "Lỗi server nội bộ" });
    }
  });

  // LOGIN
  router.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) return res.status(400).json({ message: "Email and password are required" });

      const [users] = await db.execute(
        "SELECT * FROM users WHERE email = ?",
        [email]
      );

      if (users.length === 0) {
        return res.status(401).json({ message: "Wrong email or password" });
      }

      const user = users[0];

      // Check if user has a password (for local login)
      if (!user.password) {
        return res.status(401).json({ message: "Account registered via OAuth. Please login with Google or Facebook." });
      }

      const ok = await bcrypt.compare(password, user.password);
      if (!ok) {
        return res.status(401).json({ message: "Wrong email or password" });
      }

      const token = jwt.sign({
        userId: user.id,
        email: user.email,
        name: user.name
      }, jwtSecret, { expiresIn: "2h" });

      res.json({
        accessToken: token,
        profile: {
          name: user.name,
          userId: user.id,
          photoURL: user.photo_url
        }
      });
    } catch (err) {
      securityLogger.error('Login error', { error: err.message, ip: req.ip });
      res.status(500).json({ message: "Lỗi server nội bộ" });
    }
  });

  // GOOGLE OAUTH
  router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
      try {
        const token = jwt.sign({
          userId: req.user.id,
          name: req.user.name,
          email: req.user.email,
        }, jwtSecret, { expiresIn: '2h' });

        res.redirect(`${process.env.FRONTEND_URL}/login?token=${token}`);
      } catch (err) {
        securityLogger.error('Google callback error', { error: err.message });
        res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth`);
      }
    }
  );

  // FACEBOOK OAUTH
  router.get('/facebook',
    passport.authenticate('facebook', { scope: ['public_profile'] })
  );

  router.get('/facebook/callback',
    passport.authenticate('facebook', { failureRedirect: '/login' }),
    (req, res) => {
      try {
        const token = jwt.sign({
          userId: req.user.id,
          name: req.user.name,
          email: req.user.email,
        }, jwtSecret, { expiresIn: '2h' });

        res.redirect(`${process.env.FRONTEND_URL}/login?token=${token}`);
      } catch (err) {
        securityLogger.error('Facebook callback error', { error: err.message });
        res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth`);
      }
    }
  );

  // FORGOT PASSWORD
  router.post('/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ message: "Email is required" });

      const [users] = await db.execute(
        "SELECT * FROM users WHERE email = ? AND provider = 'local'",
        [email]
      );

      // Always respond with same message to avoid user enumeration
      const genericResponse = { message: "If the email exists, a reset link has been sent" };

      if (users.length === 0) {
        // Do not reveal whether email exists
        return res.json(genericResponse);
      }

      const user = users[0];
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

      await db.execute(
        "UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?",
        [resetToken, resetTokenExpiry, user.id]
      );

      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

      // try sending email (or log link)
      await sendResetEmail(email, resetLink);

      return res.json(genericResponse);
    } catch (err) {
      securityLogger.error('Forgot password error', { error: err.message, ip: req.ip });
      return res.status(500).json({ message: "Lỗi server nội bộ" });
    }
  });

  // (Optional) Reset password endpoint - frontend should POST token + new password
  router.post('/reset-password', [
    body('token').notEmpty().withMessage('Token is required'),
    body('password').isLength({ min: 8 }).withMessage('Mật khẩu phải có ít nhất 8 ký tự')
  ], async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: "Dữ liệu không hợp lệ", errors: errors.array() });
      }

      const { token, password } = req.body;
      const [users] = await db.execute("SELECT * FROM users WHERE reset_token = ? AND reset_token_expiry > NOW()", [token]);

      if (users.length === 0) {
        return res.status(400).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
      }

      const user = users[0];

      const passwordErrors = validatePasswordStrength(password);
      if (passwordErrors.length > 0) {
        return res.status(400).json({ message: "Mật khẩu không đủ mạnh", errors: passwordErrors });
      }

      const hash = await bcrypt.hash(password, 12);
      await db.execute("UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?", [hash, user.id]);

      securityLogger.info('Password reset successful', { userId: user.id, ip: req.ip });

      return res.json({ message: "Đặt lại mật khẩu thành công" });
    } catch (err) {
      securityLogger.error('Reset password error', { error: err.message });
      return res.status(500).json({ message: "Lỗi server nội bộ" });
    }
  });

  // LOGOUT
  router.post('/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        securityLogger.error('Logout error', { error: err.message });
        return res.status(500).json({ message: 'Logout failed' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  });

  // SET PASSWORD FOR EXISTING USER (e.g., OAuth users wanting local login)
  router.post('/set-password', [
    body('email').isEmail().normalizeEmail().withMessage('Email không hợp lệ'),
    body('password').isLength({ min: 8 }).withMessage('Mật khẩu phải có ít nhất 8 ký tự')
  ], async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: "Dữ liệu không hợp lệ", errors: errors.array() });
      }

      const { email, password } = req.body;

      const passwordErrors = validatePasswordStrength(password);
      if (passwordErrors.length > 0) {
        return res.status(400).json({ message: "Mật khẩu không đủ mạnh", errors: passwordErrors });
      }

      const [users] = await db.execute("SELECT * FROM users WHERE email = ?", [email]);
      if (users.length === 0) {
        return res.status(404).json({ message: "Email không tồn tại" });
      }

      const user = users[0];
      if (user.password) {
        return res.status(400).json({ message: "Tài khoản đã có mật khẩu" });
      }

      const hash = await bcrypt.hash(password, 12);
      await db.execute("UPDATE users SET password = ? WHERE id = ?", [hash, user.id]);

      securityLogger.info('Password set for existing user', { userId: user.id, email, ip: req.ip });

      res.json({ message: "Đặt mật khẩu thành công! Bây giờ bạn có thể đăng nhập bằng email và mật khẩu." });
    } catch (err) {
      securityLogger.error('Set password error', { error: err.message, ip: req.ip });
      res.status(500).json({ message: "Lỗi server nội bộ" });
    }
  });

  // CSRF TOKEN (dummy since CSRF is disabled)
  router.get('/csrf-token', (req, res) => {
    res.json({ csrfToken: 'dummy-token' });
  });

  return router;
};
