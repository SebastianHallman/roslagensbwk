const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const limiter = require('./rateLimiter');
const invitationLimiter = require('./invitationLimiter');
const passwordResetLimiter = require('./passwordResetLimiter');

test('auth limiters retain independent quotas, headers and error responses', async (t) => {
    const app = express();
    const success = (req, res) => res.json({ ok: true });
    app.post('/signin', limiter, success);
    app.post('/verify-invite', invitationLimiter, success);
    app.post('/forgot-password', passwordResetLimiter, success);
    app.post('/reset-password', passwordResetLimiter, success);

    const server = app.listen(0, '127.0.0.1');
    t.after(() => new Promise((resolve) => {
        server.close(resolve);
        server.closeAllConnections();
    }));
    await new Promise((resolve, reject) => {
        server.once('listening', resolve);
        server.once('error', reject);
    });

    async function request(path, limit, remaining, status, body) {
        const response = await fetch(`http://127.0.0.1:${server.address().port}${path}`, { method: 'POST' });
        assert.equal(response.status, status);
        assert.equal(response.headers.get('ratelimit-limit'), String(limit));
        assert.equal(response.headers.get('ratelimit-remaining'), String(remaining));
        assert.equal(response.headers.get('ratelimit-policy'), `${limit};w=900`);
        assert.equal(response.headers.get('x-ratelimit-limit'), null);
        if (status === 429) {
            const retryAfter = Number(response.headers.get('retry-after'));
            assert.ok(retryAfter > 0 && retryAfter <= 900);
        }
        assert.deepEqual(await response.json(), body);
    }

    // Exhausting one quota must leave the other two available to the same IP.
    for (const [path, message] of [
        ['/signin', 'Too many login attempts. Try again later.'],
        ['/verify-invite', 'Too many account creation attempts. Try again later.'],
    ]) {
        for (let attempt = 1; attempt <= 10; attempt++) {
            await request(path, 10, 10 - attempt, 200, { ok: true });
        }
        await request(path, 10, 0, 429, { error: message });
    }

    // Both password reset endpoints intentionally share the same quota.
    for (let attempt = 1; attempt <= 5; attempt++) {
        const path = attempt % 2 ? '/forgot-password' : '/reset-password';
        await request(path, 5, 5 - attempt, 200, { ok: true });
    }
    for (const path of ['/forgot-password', '/reset-password']) {
        await request(path, 5, 0, 429, { error: 'Too many password reset attempts. Try again later.' });
    }
});
