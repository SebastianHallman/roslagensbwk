const { randomBytes, createHash } = require('crypto');

function hashInvitationCode(code) {
    return createHash('sha256').update(code, 'utf8').digest('hex');
}

function generateInvitationCode() {
    const code = randomBytes(16).toString('hex');
    const hashedCode = hashInvitationCode(code);
    return { code, hashedCode };
}

module.exports = {
    hashInvitationCode,
    generateInvitationCode,
};