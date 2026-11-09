const { getUserById } = require('../db');

async function requireAdmin(req, res, next) {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ error: 'Unauthorized: No session found' });
    }
    
    try {
    const user = await getUserById(req.session.userId);
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized: User not found' });
    }

    if (user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden: Admin access required' });
        
    }
    req.user = user;
} catch (error) {
    console.error('Error checking admin role:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
}

    next();
}

module.exports = requireAdmin;