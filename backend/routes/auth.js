const express = require('express');
const { authenticateAdmin } = require('../auth/authentication');

const router = express.Router();

router.post('/signin', async (req, res) => {
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

        // Here you would typically generate a session or JWT token for the authenticated user
        // For demonstration, we'll just return the user object
        res.json({ message: 'Authentication successful', user });
    } catch (error) {
        console.error('Error during authentication:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }

});

router.post('/signout', (req, res) => {
    // TODO: Implement sign-out logic, such as clearing session or JWT token
    res.json({ message: 'Sign-out not implemented' });
})

router.post('/signup', (req, res) => {
    // TODO: Implement sign-up logic with email verification and invitation token handling
    res.status(501).json({ error: 'Sign-up not implemented' });
}
);




module.exports = router;