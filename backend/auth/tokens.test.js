const { test } = require('node:test');
const assert = require('node:assert/strict');
const { hashTokenCode, generateTokenCode } = require('./tokens');

test('preserves SHA-256 hashes for existing tokens', () => {
    assert.equal(hashTokenCode('hello'), '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
});

test('generates a 32-character hex code and its matching hash', () => {
    const { code, hashedCode } = generateTokenCode();
    assert.match(code, /^[a-f0-9]{32}$/);
    assert.match(hashedCode, /^[a-f0-9]{64}$/);
    assert.equal(hashedCode, hashTokenCode(code));
});
