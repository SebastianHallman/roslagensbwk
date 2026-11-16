const createAuthLimiter = require('./createAuthLimiter');

const limiter = createAuthLimiter({
    limit: 10,
    message: 'Too many login attempts. Try again later.',
});

module.exports = limiter;

