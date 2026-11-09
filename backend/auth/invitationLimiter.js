const { rateLimit } = require('express-rate-limit');

const invitationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many account creation attempts. Try again later.'},
})

module.exports = invitationLimiter;

