const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');
const { hashTokenCode } = require('./tokens');

function loadDatabase({ tokenExists = true, failSessions = false } = {}) {
    const calls = [];
    const connection = {
        beginTransaction: async () => calls.push('begin'),
        commit: async () => calls.push('commit'),
        rollback: async () => calls.push('rollback'),
        release: () => calls.push('release'),
        execute: async (sql, params) => {
            calls.push({ sql, params: Array.from(params) });
            if (sql.includes('SELECT user_id')) return [tokenExists ? [{ user_id: 7 }] : []];
            if (failSessions && sql.includes('DELETE FROM sessions')) throw new Error('Session deletion failed');
            return [{ affectedRows: 1 }];
        },
    };
    const context = {
        module: { exports: {} }, process: { env: {} },
        require: (name) => name === 'mysql2/promise'
            ? { createPool: () => ({ getConnection: async () => connection }) }
            : {},
    };
    vm.runInNewContext(readFileSync(join(__dirname, '../db.js'), 'utf8'), context);
    return { redeem: context.module.exports.redeemPasswordResetToken, calls };
}

test('reset updates the account, revokes sessions and consumes token before commit', async () => {
    const { redeem, calls } = loadDatabase();
    assert.equal(await redeem('token-hash', 'password-hash'), true);
    assert.equal(calls[0], 'begin');
    const queries = calls.filter((call) => typeof call === 'object');
    assert.match(queries[0].sql, /expires_at > UTC_TIMESTAMP\(\) FOR UPDATE/);
    assert.deepEqual(queries[0].params, ['token-hash']);
    assert.match(queries[1].sql, /^UPDATE users SET password_hash/);
    assert.deepEqual(queries[1].params, ['password-hash', 7]);
    assert.match(queries[2].sql, /DELETE FROM sessions/);
    assert.deepEqual(queries[2].params, ['7']);
    assert.match(queries[3].sql, /^DELETE FROM password_reset_tokens/);
    assert.deepEqual(queries[3].params, [7]);
    assert.deepEqual(calls.slice(-2), ['commit', 'release']);
});

test('missing or expired reset token produces no writes', async () => {
    const { redeem, calls } = loadDatabase({ tokenExists: false });
    assert.equal(await redeem('token-hash', 'password-hash'), false);
    assert.equal(calls.filter((call) => typeof call === 'object').length, 1);
    assert.deepEqual(calls.slice(-2), ['rollback', 'release']);
});

test('session revocation failure rolls back password update and preserves token', async () => {
    const { redeem, calls } = loadDatabase({ failSessions: true });
    await assert.rejects(redeem('token-hash', 'password-hash'), /Session deletion failed/);
    assert.ok(!calls.includes('commit'));
    assert.ok(!calls.some((call) => typeof call === 'object' && call.sql.startsWith('DELETE FROM password_reset_tokens')));
    assert.deepEqual(calls.slice(-2), ['rollback', 'release']);
});

function loadRoute(result = true, fail = false) {
    let handler;
    let attachedLimiter;
    const calls = [];
    const limiter = () => {};
    const router = {
        get() {},
        post(path, ...handlers) {
            if (path === '/reset-password') {
                attachedLimiter = handlers[0];
                handler = handlers.at(-1);
            }
        },
    };
    const context = {
        module: { exports: {} }, console: { error() {} },
        require(name) {
            if (name === 'express') return { Router: () => router };
            if (name === '../auth/passwordResetLimiter') return limiter;
            if (name === '../auth/tokens') return { hashTokenCode };
            if (name === '../auth/passwords') return {
                hashPassword: async (password) => { calls.push(['hash', password]); return 'argon-hash'; },
            };
            if (name === '../db') return {
                redeemPasswordResetToken: async (...args) => {
                    calls.push(['redeem', ...args]);
                    if (fail) throw new Error('Private database details');
                    return result;
                },
            };
            return {};
        },
    };
    vm.runInNewContext(readFileSync(join(__dirname, '../routes/auth.js'), 'utf8'), context);
    assert.equal(attachedLimiter, limiter);
    return {
        calls,
        async request(body) {
            const res = {
                status(code) { this.statusCode = code; return this; },
                json(value) { this.body = value; return this; },
            };
            await handler({ body }, res);
            return res;
        },
    };
}

test('reset route rejects malformed tokens and short passwords before hashing', async () => {
    const route = loadRoute();
    for (const body of [undefined, { token: 'bad', password: 'long-password' }, { token: 'a'.repeat(32), password: 'short' }]) {
        assert.equal((await route.request(body)).statusCode, 400);
    }
    assert.deepEqual(route.calls, []);
});

test('reset route hashes both secrets and never returns them', async () => {
    const route = loadRoute();
    const token = 'a'.repeat(32);
    const res = await route.request({ token, password: 'new-password' });
    assert.equal(res.statusCode, 200);
    assert.deepEqual(route.calls, [['hash', 'new-password'], ['redeem', hashTokenCode(token), 'argon-hash']]);
    assert.ok(!JSON.stringify(res.body).includes(token));
    assert.ok(!JSON.stringify(res.body).includes('new-password'));
});

test('reset route reports consumed/expired token and hides internal errors', async () => {
    const body = { token: 'a'.repeat(32), password: 'new-password' };
    const invalid = await loadRoute(false).request(body);
    assert.equal(invalid.statusCode, 400);
    assert.equal(invalid.body.code, 'INVALID_RESET_TOKEN');
    const failed = await loadRoute(true, true).request(body);
    assert.equal(failed.statusCode, 500);
    assert.equal(failed.body.error, 'Internal Server Error');
});
