const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sql = require('../db/dbConnection.js');

const JWT_EXPIRES_IN = '30d';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000;
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

function isLocalhostUrl(url) {
    return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$/i.test(url);
}

function getCookieOptions() {
    const frontendUrl = (process.env.FRONTEND_URL || '').replace(/\/$/, '');
    const isLocalhost = isLocalhostUrl(frontendUrl);
    const secure = process.env.NODE_ENV === 'production' && !isLocalhost;

    return {
        httpOnly: true,
        secure,
        sameSite: secure ? 'none' : 'lax'
    };
}

function normalizeEmail(email) {
    return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
    return typeof password === 'string' && password.length >= 8;
}

function getGoogleConfig(req) {
    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.ClientID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.ClientSecret;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${req.protocol}://${req.get('host')}/auth/google/callback`;

    return {
        clientId,
        clientSecret,
        redirectUri
    };
}

function createToken(user) {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not configured');
    }

    return jwt.sign(
        {
            userId: user.id,
            email: user.email
        },
        process.env.JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
}

function sendAuthResponse(res, user, statusCode = 200) {
    const token = createToken(user);

    res.cookie('token', token, {
        ...getCookieOptions(),
        maxAge: COOKIE_MAX_AGE
    });

    return res.status(statusCode).json({
        success: true,
        token,
        user: {
            id: user.id,
            email: user.email
        }
    });
}

function sendAuthCookie(res, user) {
    const token = createToken(user);

    res.cookie('token', token, {
        ...getCookieOptions(),
        maxAge: COOKIE_MAX_AGE
    });

    return token;
}

function getFrontendRedirectUrl() {
    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
    return `${frontendUrl}/`;
}

async function register(req, res) {
    try {
        const email = normalizeEmail(req.body.email);
        const { password } = req.body;

        if (!isValidEmail(email) || !validatePassword(password)) {
            return res.status(400).json({
                success: false,
                message: 'Valid email and password of at least 8 characters are required'
            });
        }

        const existingUsers = await sql`
            SELECT id
            FROM users
            WHERE email = ${email}
            LIMIT 1
        `;

        if (existingUsers.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'User already exists'
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const users = await sql`
            INSERT INTO users (email, password_hash)
            VALUES (${email}, ${passwordHash})
            RETURNING id, email
        `;

        return sendAuthResponse(res, users[0], 201);
    }
    catch (err) {
        console.error('Register error:', err);

        return res.status(500).json({
            success: false,
            message: 'Registration failed'
        });
    }
}

async function login(req, res) {
    try {
        const email = normalizeEmail(req.body.email);
        const { password } = req.body;

        if (!isValidEmail(email) || typeof password !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Valid email and password are required'
            });
        }

        const users = await sql`
            SELECT id, email, password_hash
            FROM users
            WHERE email = ${email}
            LIMIT 1
        `;

        const user = users[0];

        if (!user || !user.password_hash) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const passwordMatches = await bcrypt.compare(password, user.password_hash);

        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        return sendAuthResponse(res, user);
    }
    catch (err) {
        console.error('Login error:', err);

        return res.status(500).json({
            success: false,
            message: 'Login failed'
        });
    }
}

function startGoogleAuth(req, res) {
    const { clientId, redirectUri } = getGoogleConfig(req);

    if (!clientId) {
        return res.status(500).json({
            success: false,
            message: 'Google OAuth client ID is not configured'
        });
    }

    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        access_type: 'offline',
        prompt: 'select_account'
    });

    if (process.env.NODE_ENV !== 'production') {
        console.log(`Google OAuth redirect URI: ${redirectUri}`);
    }

    return res.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
}

async function handleGoogleCallback(req, res) {
    try {
        const { code } = req.query;
        const { clientId, clientSecret, redirectUri } = getGoogleConfig(req);

        if (!code) {
            return res.status(400).json({
                success: false,
                message: 'Google authorization code is required'
            });
        }

        if (!clientId || !clientSecret) {
            return res.status(500).json({
                success: false,
                message: 'Google OAuth credentials are not configured'
            });
        }

        const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code'
            })
        });

        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok) {
            console.error('Google token exchange error:', tokenData);

            return res.status(401).json({
                success: false,
                message: 'Google authentication failed'
            });
        }

        const profileResponse = await fetch(GOOGLE_USERINFO_URL, {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`
            }
        });

        const profile = await profileResponse.json();

        if (!profileResponse.ok || !profile.email || !profile.id) {
            console.error('Google profile error:', profile);

            return res.status(401).json({
                success: false,
                message: 'Google profile verification failed'
            });
        }

        const email = normalizeEmail(profile.email);

        const users = await sql`
            INSERT INTO users (email, google_id)
            VALUES (${email}, ${profile.id})
            ON CONFLICT (email)
            DO UPDATE SET google_id = COALESCE(users.google_id, EXCLUDED.google_id)
            RETURNING id, email
        `;

        sendAuthCookie(res, users[0]);
        return res.redirect(getFrontendRedirectUrl());
    }
    catch (err) {
        console.error('Google callback error:', err);

        return res.status(500).json({
            success: false,
            message: 'Google authentication failed'
        });
    }
}

function getCurrentUser(req, res) {
    return res.json({
        success: true,
        user: req.user
    });
}

function logout(req, res) {
    res.clearCookie('token', getCookieOptions());

    return res.json({
        success: true,
        message: 'Logged out successfully'
    });
}

module.exports = {
    register,
    login,
    startGoogleAuth,
    handleGoogleCallback,
    getCurrentUser,
    logout
};
