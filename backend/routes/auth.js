const express = require('express');
const { authenticateAdmin} = require('../auth/authentication');
const requireAdmin = require('../auth/requireAdmin');
const { createAdminInvitation, redeemAdminInvitation, getUserByEmail, savePasswordResetToken, redeemPasswordResetToken } = require('../db');
const { hashPassword } = require('../auth/passwords');
const limiter = require('../auth/rateLimiter');
const invitationLimiter = require('../auth/invitationLimiter');
const passwordResetLimiter = require('../auth/passwordResetLimiter');
const { generateTokenCode, hashTokenCode } = require('../auth/tokens');
const { isValidEmail } = require('../auth/email');
const sendMail = require('../email/sendEmail');

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

    if (!isValidEmail(email)) {
        return res.status(400).json({ error: 'Valid email is required' });
    }

    try {
        const existingUser = await getUserByEmail(email.trim());
        if (existingUser) {
            return res.status(409).json({ error: 'An account for this email already exists', code: 'ACCOUNT_EXISTS' });
        }
        const { code, hashedCode } = generateTokenCode();
        const url = new URL('/acceptera-inbjudan', process.env.FRONTEND_URL);
        url.searchParams.set('token', code);
        
        await createAdminInvitation(email.trim(), hashedCode);
        await sendMail(email.trim(), 'bwk-admininbjudan', {INVITE_URL: url.toString()});
        res.status(201).json({ message: 'Invitation created or renewed', code });
    } catch (error) {
        console.error('Error creating invitation:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/forgot-password', passwordResetLimiter, async (req, res) => {
    const { email } = req.body ?? {};

    if (!isValidEmail(email)) {
        return res.status(400).json({ error: 'Valid email is required' });
    }

    try {
        const user = await getUserByEmail(email.trim());

        if (user) {
            const { code, hashedCode } = generateTokenCode();
            const url = new URL('/aterstall-losenord', process.env.FRONTEND_URL);
            url.searchParams.set('token', code);

            await savePasswordResetToken(user.id, hashedCode);
            await sendMail(user.email, 'bwk-password-reset', {
                RESET_PASSWORD_URL: url.toString(),
            });
        }
    } catch {
        console.error('Password reset request failed.');
    }

    return res.status(200).json({
        message: 'Om ett konto finns för adressen skickar vi en återställningslänk.',
    });
});

router.post('/reset-password', passwordResetLimiter, async (req, res) => {
    const { token, password } = req.body ?? {};
    if (typeof token !== 'string' || !/^[a-f0-9]{32}$/.test(token)) {
        return res.status(400).json({ error: 'Invalid or expired reset link', code: 'INVALID_RESET_TOKEN' });
    }
    if (typeof password !== 'string' || password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long', code: 'INVALID_PASSWORD' });
    }

    try {
        const passwordHash = await hashPassword(password);
        const changed = await redeemPasswordResetToken(hashTokenCode(token), passwordHash);
        if (!changed) {
            return res.status(400).json({ error: 'Invalid or expired reset link', code: 'INVALID_RESET_TOKEN' });
        }
        return res.status(200).json({ message: 'Password updated. Sign in with your new password.' });
    } catch {
        console.error('Password reset failed.');
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/verify-invite', invitationLimiter, async (req, res) => {
    const { token, password } = req.body ?? {};

    if (typeof token !== 'string' || !token.trim()) {
        return res.status(400).json({ error: 'Token is required' });
    }
    if (typeof password !== 'string' || !password) {
        return res.status(400).json({ error: 'Password is required' });
    }
    if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }



    try {
        

        const passwordHash = await hashPassword(password);
        const tokenHash = hashTokenCode(token);
        const redemption = await redeemAdminInvitation(tokenHash, passwordHash);

        if (!redemption) {
            res.status(400).json({ error: 'Invalid or expired invite'});
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
