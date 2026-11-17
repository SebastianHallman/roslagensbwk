const createAuthLimiter = require('./createAuthLimiter');

const contactLimiter = createAuthLimiter({
    limit: 5,
    message: 'Too many contact attempts. Try again later.',
});

module.exports = contactLimiter;
