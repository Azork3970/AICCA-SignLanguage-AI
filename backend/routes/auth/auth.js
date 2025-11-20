const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;

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

    router.post('/register', async (req, res) => {
        try {
            const { name, email, password } = req.body;

            if (!name || !email || !password)
                return res.status(400).json({ message: "Missing fields" });

            const [exists] = await db.execute("SELECT * FROM users WHERE email = ?", [email]);
            if (exists.length > 0)
                return res.status(400).json({ message: "Email already used" });

            const hash = await bcrypt.hash(password, 12);
            const id = crypto.randomUUID();

            await db.execute(
                "INSERT INTO users (id, name, email, password, provider) VALUES (?, ?, ?, ?, 'local')",
                [id, name, email, hash]
            );

            res.json({ message: "Registered!" });

        } catch (err) {
            res.status(500).json({ error: err.message });
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

    return router;
};
