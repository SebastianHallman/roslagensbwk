const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');
const utils = require('../utils');

function tournament() {
    return {
        title: ' Cup ', description: ' Updated ', status: 'published',
        rounds: [
            { id: 21, starts_at: '2026-11-14 09:00:00', venue: ' Hall A ', results_url: 'https://example.com/a' },
            { id: 22, starts_at: '2026-12-05 10:30:00', venue: 'Hall B' },
        ],
    };
}

function database({ exists = true, existingIds = [21, 22], failAt } = {}) {
    const calls = [];
    const failure = new Error('Simulated database failure');
    const connection = {
        beginTransaction: async () => calls.push('begin'),
        execute: async (sql, values) => {
            calls.push({ sql, values });
            if (sql.startsWith('SELECT id FROM tournaments')) return [exists ? [{ id: 7 }] : []];
            if (sql.startsWith('SELECT id FROM rounds')) return [existingIds.map((id) => ({ id }))];
            if ((failAt === 'metadata' && sql.startsWith('UPDATE tournaments')) ||
                (failAt === 'round-update' && sql.startsWith('UPDATE rounds')) ||
                (failAt === 'delete' && sql.startsWith('DELETE')) ||
                (failAt === 'insert' && sql.startsWith('INSERT'))) throw failure;
            return [{ affectedRows: 0 }];
        },
        commit: async () => { calls.push('commit'); if (failAt === 'commit') throw failure; },
        rollback: async () => calls.push('rollback'),
        release: () => calls.push('release'),
    };
    const moduleMock = { exports: {} };
    const dependencies = {
        './utils': utils,
        'mysql2/promise': { createPool: () => ({ getConnection: async () => { calls.push('connect'); return connection; } }) },
    };
    const file = join(__dirname, '..', 'db.js');
    const factory = vm.runInThisContext(`(function(require, module) {\n${readFileSync(file, 'utf8')}\n})`, { filename: file });
    factory((name) => {
        if (Object.hasOwn(dependencies, name)) return dependencies[name];
        throw new Error(`Unexpected dependency: ${name}`);
    }, moduleMock);
    return { update: moduleMock.exports.updateTournament, calls, failure };
}

test('avvisar ogiltiga turnerings-id:n och rondändringar före anslutning', async () => {
    const db = database();
    for (const id of [undefined, null, '7', 0, -1, 1.5, NaN, Infinity, 4294967296]) {
        await assert.rejects(db.update(id, tournament()), { status: 400, code: 'INVALID_TOURNAMENT' });
    }
    for (const id of [null, '21', 0, -1, 1.5, 2147483648]) {
        await assert.rejects(db.update(7, { ...tournament(), rounds: [{ ...tournament().rounds[0], id }] }), { status: 400 });
    }
    for (const removed_round_ids of [null, {}, [21, 21], [0], ['22'], [2147483648], [21]]) {
        await assert.rejects(db.update(7, { ...tournament(), removed_round_ids }), { status: 400 });
    }
    await assert.rejects(db.update(7, { ...tournament(), rounds: [tournament().rounds[0], tournament().rounds[0]] }), { status: 400 });
    assert.deepEqual(db.calls, []);
});

test('saknad turnering ger false utan skrivningar', async () => {
    const db = database({ exists: false });
    assert.equal(await db.update(7, tournament()), false);
    assert.deepEqual(db.calls, ['connect', 'begin',
        { sql: 'SELECT id FROM tournaments WHERE id = ? FOR UPDATE', values: [7] },
        'rollback', 'release']);
});

test('befintliga ronder uppdateras med samma id och båda id:n i WHERE', async () => {
    const db = database();
    const input = tournament();
    const original = structuredClone(input);
    assert.equal(await db.update(7, input), true);
    const writes = db.calls.filter((call) => call.sql && !call.sql.startsWith('SELECT'));
    assert.equal(writes.length, 3);
    assert.deepEqual(writes[0].values, ['Cup', 'Updated', 'published', 7]);
    assert.match(writes[1].sql, /UPDATE rounds .*WHERE id = \? AND tournament_id = \?$/);
    assert.deepEqual(writes[1].values, ['2026-11-14 09:00:00', 'Hall A', 'https://example.com/a', 21, 7]);
    assert.deepEqual(writes[2].values, ['2026-12-05 10:30:00', 'Hall B', null, 22, 7]);
    assert.deepEqual(db.calls.slice(-2), ['commit', 'release']);
    assert.deepEqual(input, original);
});

test('rond utan id läggs till och en borttagen rond måste anges uttryckligen', async () => {
    const db = database();
    const newRound = { ...tournament().rounds[1] };
    delete newRound.id;
    const input = { ...tournament(), rounds: [tournament().rounds[0], newRound], removed_round_ids: [22] };
    assert.equal(await db.update(7, input), true);
    const insertion = db.calls.find((call) => call.sql?.startsWith('INSERT'));
    assert.deepEqual(insertion.values, [7, '2026-12-05 10:30:00', 'Hall B', null]);
    const deletions = db.calls.filter((call) => call.sql?.startsWith('DELETE'));
    assert.deepEqual(deletions, [{ sql: 'DELETE FROM rounds WHERE id = ? AND tournament_id = ?', values: [22, 7] }]);
});

test('utelämnade ronder lämnas kvar och enbart metadata kan uppdateras', async () => {
    const db = database();
    assert.equal(await db.update(7, { ...tournament(), rounds: [] }), true);
    assert.equal(db.calls.some((call) => /^(INSERT|DELETE|UPDATE rounds)/.test(call.sql ?? '')), false);
});

test('rond-id som inte tillhör turneringen avvisas före skrivning', async () => {
    for (const input of [
        { ...tournament(), rounds: [{ ...tournament().rounds[0], id: 99 }] },
        { ...tournament(), rounds: [], removed_round_ids: [99] },
    ]) {
        const db = database();
        await assert.rejects(db.update(7, input), { status: 400 });
        assert.equal(db.calls.some((call) => /^(UPDATE|INSERT|DELETE)/.test(call.sql ?? '')), false);
        assert.deepEqual(db.calls.slice(-2), ['rollback', 'release']);
    }
});

test('bara utkast kan sakna ronder efter ändringen', async () => {
    const input = { ...tournament(), rounds: [], removed_round_ids: [21, 22] };
    const db = database();
    await assert.rejects(db.update(7, input), { status: 400 });
    assert.equal(db.calls.some((call) => call.sql?.startsWith('DELETE')), false);
    assert.equal(await database().update(7, { ...input, status: 'draft' }), true);
    await assert.rejects(database({ existingIds: [] }).update(7, { ...tournament(), rounds: [] }), { status: 400 });
});

for (const failAt of ['metadata', 'round-update', 'insert', 'delete', 'commit']) {
    test(`fel vid ${failAt} ger rollback och release`, async () => {
        const db = database({ failAt });
        const input = tournament();
        if (failAt === 'insert') delete input.rounds[1].id;
        if (failAt === 'delete') { input.rounds.pop(); input.removed_round_ids = [22]; }
        await assert.rejects(db.update(7, input), (error) => error === db.failure);
        assert.deepEqual(db.calls.slice(-2), ['rollback', 'release']);
        if (failAt !== 'commit') assert.equal(db.calls.includes('commit'), false);
    });
}
