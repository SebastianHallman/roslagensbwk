const { test } = require('node:test');
const assert = require('node:assert/strict');
const { pool } = require('../db');
const { createDirectoryEntry } = require('./create');

const insertSql = 'INSERT INTO teams (name, series) VALUES (?, ?)';
const requestId = '12'.repeat(16);

test('replays a committed creation without overwriting it, even if the retry changed', async (t) => {
    let record;
    let inserts = 0;
    t.mock.method(pool, 'getConnection', async () => ({
        beginTransaction() {}, commit() {}, rollback() {}, release() {},
        async execute(sql, values) {
            if (sql.startsWith('INSERT INTO directory_create_requests')) {
                record ??= { entry_id: null, payload_hash: values[2] };
            } else if (sql.startsWith('SELECT entry_id')) {
                return [[record]];
            } else if (sql === insertSql) {
                inserts++;
                return [{ insertId: 7 }];
            } else if (sql.startsWith('UPDATE directory_create_requests')) {
                record.entry_id = values[0];
            } else assert.fail(sql);
        },
    }));
    const res = { status(code) { this.code = code; return this; }, json(data) { this.body = data; } };
    for (const [name, status, reviewExisting] of [['Team', 201, false], ['Team', 200, false], ['Edited', 200, true]]) {
        await createDirectoryEntry(res, 'team', requestId, insertSql, [name, '[]']);
        assert.equal(res.code, status);
        assert.equal(res.body.id, 7);
        assert.equal(Boolean(res.body.reviewExisting), reviewExisting);
    }
    assert.equal(inserts, 1);
});

test('rolls back the entry and request key together when recording the result fails', async (t) => {
    const calls = [];
    t.mock.method(pool, 'getConnection', async () => ({
        beginTransaction() { calls.push('begin'); }, commit() { assert.fail('Unexpected commit'); },
        rollback() { calls.push('rollback'); }, release() { calls.push('release'); },
        async execute(sql) {
            if (sql.startsWith('SELECT entry_id')) return [[{ entry_id: null }]];
            if (sql === insertSql) return [{ insertId: 7 }];
            if (sql.startsWith('UPDATE directory_create_requests')) throw new Error('Simulated write failure');
        },
    }));
    await assert.rejects(createDirectoryEntry({}, 'team', requestId, insertSql, ['Team', '[]']), /Simulated write failure/);
    assert.deepEqual(calls, ['begin', 'rollback', 'release']);
});
