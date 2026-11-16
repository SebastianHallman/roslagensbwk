const { rateLimit } = require('express-rate-limit');

function createAuthLimiter({ limit, message }) {
    return rateLimit({
        windowMs: 15 * 60 * 1000,
        limit,
        standardHeaders: true,
        legacyHeaders: false,
        message: { error: message },
    });
}

module.exports = createAuthLimiter;
