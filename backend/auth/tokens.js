const { randomBytes, createHash } = require('crypto');

function hashTokenCode(code) {
    return createHash('sha256').update(code, 'utf8').digest('hex');
}

function generateTokenCode() {
    const code = randomBytes(16).toString('hex');
    const hashedCode = hashTokenCode(code);
    return { code, hashedCode };
}

module.exports = {
    hashTokenCode,
    generateTokenCode,
};
