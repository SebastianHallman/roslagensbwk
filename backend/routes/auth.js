const express = require('express');
const { authenticateAdmin} = require('../auth/authentication');
const requireAdmin = require('../auth/requireAdmin');
const { createAdminInvitation, redeemAdminInvitation} = require('../db');
const { hashPassword } = require('../auth/passwords');
const limiter = require('../auth/rateLimiter');
const { generateInvitationCode, hashInvitationCode } = require('../auth/invitations');

const router = express.Router();

router.post('/signin', limiter, async (req, res) => {
    const { email, password } = req.body ?? {};

    if (
        typeof email !== 'string' ||
        typeof password !== 'string' ||
        !email.trim() || !password
    ) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const user = await authenticateAdmin(email, password);
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        req.session.regenerate((err) => {
            if (err) {
                console.error('Session regeneration error:', err);
                return res.status(500).json({ error: 'Internal Server Error' });
            }
            req.session.userId = user.id;
            req.session.save((err) => {
                if (err) {
                    console.error('Session save error:', err);
                    return res.status(500).json({ error: 'Internal Server Error' });
                }
                res.json({ message: 'Authentication successful', user });
            });
        });
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/signout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Session destruction error:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        res.clearCookie('connect.sid', { path: '/' });
        res.status(200).json({ message: 'Signed out successfully' });
    });
});

router.post('/signup', (req, res) => {
    // TODO: Implement sign-up logic with email verification and invitation token handling
    res.status(501).json({ error: 'Sign-up not implemented' });
}
);

router.get('/me', requireAdmin, (req, res) => {
    res.json({ user: req.user });
});

router.post('/invite', requireAdmin, async (req, res) => {
    const { email } = req.body ?? {};

    if (typeof email !== 'string' || !email.trim()) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        const {code, hashedCode} = generateInvitationCode();
        await createAdminInvitation(email, hashedCode);
        res.status(201).json({ message: 'Invitation created', code });
    } catch (error) {
        console.error('Error creating invitation:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/verify-invite', async (req, res) => {
    const { token, email, password } = req.body ?? {};

    if (typeof token !== 'string' || !token.trim()) {
        return res.status(400).json({ error: 'Token is required' });
    }
    if (typeof email !== 'string' || !email.trim()) {
        return res.status(400).json({ error: 'Email is required' });
    }
    if (typeof password !== 'string' || !password) {
        return res.status(400).json({ error: 'Password is required' });
    }
    if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }



    try {
        

        const passwordHash = await hashPassword(password);
        const tokenHash = hashInvitationCode(token);
        const redemption = await redeemAdminInvitation(email, tokenHash, passwordHash);

        if (!redemption) {
            res.status(400).json({ message: 'Expired invite'});
            return null
        }
        res.status(201).json({ message: 'Admin user created successfully' });
        
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            res.status(409).json({ message: 'Account already exists'})
        } else {
            console.error('Error verifying invitation token:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
});



module.exports = router;