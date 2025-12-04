const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { body, validationResult } = require('express-validator');
const winston = require('winston');
const csrf = require('csurf');
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

    // CSRF Protection middleware
    const csrfProtection = csrf({ cookie: true });

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
                    "INSERT INTO users (id, name, email, provider, provider_id, photo_url) VALUES (?, ?, ?, ?, ?, ?)",
                    [
                        userId,
                        profile.displayName,
                        profile.emails[0].value,
                        'google',
                        profile.id,
                        profile.photos[0].value
                    ]
                );

                user = { id: userId, name: profile.displayName, email: profile.emails[0].value };
            } else {
                user = existingUsers[0];
            }

            return done(null, user);
        } catch (err) {
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
        profileFields: ['id', 'displayName', 'photos']
    },
async (accessToken, refreshToken, profile, done) => {
    try {
        // Fallback email trong TH Facebook không trả về email
        const email =
            profile.emails && profile.emails.length > 0
                ? profile.emails[0].value
                : `${profile.id}@facebook.com`; // tạo email ảo tránh lỗi NULL

        const photo =
            profile.photos && profile.photos.length > 0
                ? profile.photos[0].value
                : null;

        // Kiểm tra user đã tồn tại chưa
        const [existingUsers] = await db.execute(
            "SELECT * FROM users WHERE provider_id = ? AND provider = 'facebook'",
            [profile.id]
        );

        let user;
        if (existingUsers.length === 0) {
            const userId = crypto.randomUUID();

            await db.execute(
                "INSERT INTO users (id, name, email, provider, provider_id, photo_url) VALUES (?, ?, ?, ?, ?, ?)",
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
        return done(err, null);
    }
}));

    // SESSION
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
        const [rows] = await db.execute("SELECT * FROM users WHERE id = ?", [id]);
        done(null, rows[0]);
    });

    // -------------------------
    // AUTH ROUTES
    // -------------------------

    // CSRF Token endpoint
    router.get('/csrf-token', (req, res) => {
        res.json({ csrfToken: req.csrfToken() });
    });

    // Password strength validation function
    const validatePasswordStrength = (password) => {
        const errors = [];
        if (password.length < 8) errors.push('Mật khẩu phải có ít nhất 8 ký tự');
        if (!/[A-Z]/.test(password)) errors.push('Mật khẩu phải chứa ít nhất 1 chữ hoa');
        if (!/[a-z]/.test(password)) errors.push('Mật khẩu phải chứa ít nhất 1 chữ thường');
        if (!/\d/.test(password)) errors.push('Mật khẩu phải chứa ít nhất 1 số');
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) errors.push('Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt');
        return errors;
    };

    router.post('/register', csrfProtection, [
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

            // Additional password strength validation
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
                email: req.body.email
            });
            res.status(500).json({ message: "Lỗi server nội bộ" });
        }
    });


    // LOGIN ROUTE
    router.post('/login', async (req, res) => {
        const { email, password } = req.body;

        const [users] = await db.execute(
            "SELECT * FROM users WHERE email = ? AND provider = 'local'",
            [email]
        );

        if (users.length === 0)
            return res.status(401).json({ message: "Wrong email or password" });

        const user = users[0];
        const ok = await bcrypt.compare(password, user.password);
        if (!ok)
            return res.status(401).json({ message: "Wrong email or password" });

        const token = jwt.sign({
            userId: user.id,
            email: user.email,
            name: user.name
        }, process.env.JWT_SECRET, { expiresIn: "2h" });

        res.json({
            accessToken: token,
            profile: {
                name: user.name,
                userId: user.id,
                photoURL: user.photo_url
            }
        });
    });

    // GOOGLE ROUTES
    router.get('/google',
        passport.authenticate('google', { scope: ['profile', 'email'] })
    );

    router.get('/google/callback',
        passport.authenticate('google', { failureRedirect: '/login' }),
        (req, res) => {
            const token = jwt.sign({
                userId: req.user.id,
                name: req.user.name,
                email: req.user.email,
            }, process.env.JWT_SECRET, { expiresIn: '2h' });

            res.redirect(`${process.env.FRONTEND_URL}/login?token=${token}`);
        }
    );

    // FACEBOOK ROUTES
    router.get('/facebook',
    passport.authenticate('facebook', { scope: ['public_profile'] })
);


    router.get('/facebook/callback',
        passport.authenticate('facebook', { failureRedirect: '/login' }),
        (req, res) => {
            const token = jwt.sign({
                userId: req.user.id,
                name: req.user.name,
                email: req.user.email,
            }, process.env.JWT_SECRET, { expiresIn: '2h' });

            res.redirect(`${process.env.FRONTEND_URL}/login?token=${token}`);
        }
    );

    // FORGOT PASSWORD ROUTE
    router.post('/forgot-password', async (req, res) => {
        try {
            const { email } = req.body;

            if (!email) return res.status(400).json({ message: "Email is required" });

            const [users] = await db.execute(
                "SELECT * FROM users WHERE email = ? AND provider = 'local'",
                [email]
            );

            if (users.length === 0) {
                // Don't reveal if email exists for security
                return res.json({ message: "If the email exists, a reset link has been sent" });
            }

            const user = users[0];
            const resetToken = crypto.randomBytes(32).toString('hex');
            const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

            // Store reset token in database (you might want to add a reset_token column)
            await db.execute(
                "UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?",
                [resetToken, resetTokenExpiry, user.id]
            );

            // Send email with reset link
            const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

            if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
                // Use Gmail if credentials are available
                const transporter = nodemailer.createTransporter({
                    service: 'gmail',
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASS
                    }
                });

                const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: email,
                    subject: 'Password Reset Request',
                    html: `
                        <h2>Password Reset</h2>
                        <p>You requested a password reset for your account.</p>
                        <p>Click the link below to reset your password:</p>
                        <a href="${resetLink}">Reset Password</a>
                        <p>This link will expire in 1 hour.</p>
                        <p>If you didn't request this, please ignore this email.</p>
                    `
                };

                await transporter.sendMail(mailOptions);
                console.log(`✅ Password reset email sent to ${email}`);
            } else {
                // Fallback: Log the reset link to console for testing
                console.log(`🔗 Password reset link for ${email}: ${resetLink}`);
                console.log('⚠️  Email credentials not configured. Copy the link above to test manually.');
            }

            res.json({ message: "If the email exists, a reset link has been sent" });

        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    return router;
};
