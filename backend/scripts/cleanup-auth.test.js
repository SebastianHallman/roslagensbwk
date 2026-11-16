const { test } = require('node:test');
const assert = require('node:assert/strict');
const { cleanupExpiredAuth } = require('./cleanup-auth');

function database({ failQuery = 0, counts = [2, 3, 4] } = {}) {
    const calls = [];
    let query = 0;
    const connection = {
        async beginTransaction() { calls.push('begin'); },
        async execute(sql) {
            calls.push(sql);
            query++;
            if (query === failQuery) throw new Error('Database unavailable');
            return [{ affectedRows: counts[query - 1] }];
        },
        async commit() { calls.push('commit'); },
        async rollback() { calls.push('rollback'); },
        release() { calls.push('release'); },
    };
    return { calls, pool: { async getConnection() { return connection; } } };
}

test('cleanup only targets expired auth records, using UTC dates and epoch seconds', async () => {
    const { calls, pool } = database();
    assert.deepEqual(await cleanupExpiredAuth(pool), {
        invitations: 2, passwordResets: 3, sessions: 4,
    });
    assert.deepEqual(calls, [
        'begin',
        'DELETE FROM admin_email_whitelist WHERE invitation_expires_at <= UTC_TIMESTAMP()',
        'DELETE FROM password_reset_tokens WHERE expires_at <= UTC_TIMESTAMP()',
        'DELETE FROM sessions WHERE expires <= UNIX_TIMESTAMP()',
        'commit',
        'release',
    ]);
});

test('an empty cleanup succeeds with zero counts', async () => {
    const { pool } = database({ counts: [0, 0, 0] });
    assert.deepEqual(await cleanupExpiredAuth(pool), {
        invitations: 0, passwordResets: 0, sessions: 0,
    });
});

test('a failed deletion rolls back earlier deletions and releases the connection', async () => {
    for (const failQuery of [1, 2, 3]) {
        const { calls, pool } = database({ failQuery });
        await assert.rejects(cleanupExpiredAuth(pool), /Database unavailable/);
        assert.equal(calls.filter((call) => call.startsWith('DELETE')).length, failQuery);
        assert.ok(!calls.includes('commit'));
        assert.deepEqual(calls.slice(-2), ['rollback', 'release']);
    }
});
