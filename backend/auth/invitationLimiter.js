const createAuthLimiter = require('./createAuthLimiter');

const invitationLimiter = createAuthLimiter({
    limit: 10,
    message: 'Too many account creation attempts. Try again later.',
});

module.exports = invitationLimiter;

