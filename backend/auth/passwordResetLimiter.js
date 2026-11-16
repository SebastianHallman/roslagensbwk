const createAuthLimiter = require('./createAuthLimiter');

const passwordResetLimiter = createAuthLimiter({
    limit: 5,
    message: 'Too many password reset attempts. Try again later.',
});

module.exports = passwordResetLimiter;
