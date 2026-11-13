const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');
const { validateTournament } = require('../utils');

function tournament() {
    return {
        title: ' Höstcupen ', description: ' En tävling. ', status: 'published',
        rounds: [
            { starts_at: '2028-02-29 09:00:00', venue: ' Hall A ', results_url: ' https://example.com/results ' },
            { starts_at: '2028-03-01 10:30:00', venue: 'Hall B' },
        ],
    };
}

function rejects(input) {
    assert.throws(() => validateTournament(input), (error) => error.status === 400 && error.code === 'INVALID_TOURNAMENT');
}

test('valideringsfel har engelska meddelanden samt oförändrad status och kod', () => {
    const cases = [
        [null, 'Tournament must be an object.'],
        [{ ...tournament(), title: '' }, 'Title must contain between 1 and 255 characters.'],
        [{ ...tournament(), status: 'unknown' }, 'Status must be draft or published.'],
        [{ ...tournament(), rounds: [] }, 'A published tournament must have at least one round.'],
        [{ ...tournament(), rounds: [{ starts_at: 'invalid', venue: 'Hall A' }] }, 'Round 1 must have a valid start date in YYYY-MM-DD HH:mm:ss format.'],
        [{ ...tournament(), rounds: [{ ...tournament().rounds[0], venue: '' }] }, 'Round 1 venue must contain between 1 and 255 characters.'],
        [{ ...tournament(), rounds: [{ ...tournament().rounds[0], results_url: 'invalid' }] }, 'Round 1 results URL must be a complete HTTP or HTTPS URL.'],
    ];
    for (const [input, message] of cases) {
        assert.throws(() => validateTournament(input), { message, status: 400, code: 'INVALID_TOURNAMENT' });
    }
});

test('normaliserar separata rondlokaler och frivilliga länkar utan att ändra indata', () => {
    const input = tournament();
    const original = structuredClone(input);
    const result = validateTournament(input);
    assert.equal(result.title, 'Höstcupen');
    assert.equal(result.description, 'En tävling.');
    assert.equal(result.rounds[0].venue, 'Hall A');
    assert.equal(result.rounds[1].venue, 'Hall B');
    assert.equal(result.rounds[0].results_url, 'https://example.com/results');
    assert.equal(result.rounds[1].results_url, null);
    assert.deepEqual(input, original);
});

test('tillåter tomma utkast och använder draft som standard, men kräver en rond vid publicering', () => {
    assert.equal(validateTournament({ ...tournament(), status: undefined, rounds: [] }).status, 'draft');
    rejects({ ...tournament(), rounds: [] });
    for (const status of ['other', null, 1]) rejects({ ...tournament(), status });
});

test('avvisar felaktig form och obligatoriska texter', () => {
    for (const input of [null, undefined, [], 'text']) rejects(input);
    for (const field of ['title', 'description']) {
        for (const value of ['', '   ', null, 123]) rejects({ ...tournament(), [field]: value });
    }
    for (const rounds of [null, undefined, {}, [null], [[]], new Array(1)]) rejects({ ...tournament(), rounds });
    for (const venue of ['', '   ', null, 123]) rejects({ ...tournament(), rounds: [{ ...tournament().rounds[0], venue }] });
});

test('kontrollerar textgränser inklusive Unicode', () => {
    assert.equal(validateTournament({ ...tournament(), title: '🎳'.repeat(255) }).title.length, 510);
    rejects({ ...tournament(), title: 'x'.repeat(256) });
    assert.equal(validateTournament({ ...tournament(), description: 'x'.repeat(3000) }).description.length, 3000);
    rejects({ ...tournament(), description: 'x'.repeat(3001) });
    rejects({ ...tournament(), rounds: [{ ...tournament().rounds[0], venue: 'x'.repeat(256) }] });
});

test('kontrollerar verkliga datum, skottår och klockslag', () => {
    for (const starts_at of ['2027-02-29 09:00:00', '2028-04-31 09:00:00', '2028-00-01 09:00:00', '2028-13-01 09:00:00', '2028-01-00 09:00:00', '2028-01-01 24:00:00', '2028-01-01 09:60:00', '2028-01-01 09:00:60', '0999-01-01 09:00:00', '2028-01-01T09:00:00Z', null]) {
        rejects({ ...tournament(), rounds: [{ ...tournament().rounds[0], starts_at }] });
    }
    for (const starts_at of ['1000-01-01 00:00:00', '2028-02-29 23:59:59', '9999-12-31 23:59:59']) {
        assert.equal(validateTournament({ ...tournament(), rounds: [{ ...tournament().rounds[0], starts_at }] }).rounds[0].starts_at, starts_at);
    }
});

test('accepterar tomma resultatlänkar och HTTP(S), avvisar andra värden', () => {
    for (const results_url of [undefined, null, '', '   ', 'http://example.com/', 'https://example.com/']) {
        validateTournament({ ...tournament(), rounds: [{ ...tournament().rounds[0], results_url }] });
    }
    for (const results_url of [42, {}, 'example.com', 'https:example.com', 'http:/example.com', 'javascript:alert(1)', 'ftp://example.com/', 'https://example.com/' + 'x'.repeat(2048)]) {
        rejects({ ...tournament(), rounds: [{ ...tournament().rounds[0], results_url }] });
    }
});

test('ogiltiga indata stoppas innan anslutning; giltiga sparas i en gemensam transaktion', async () => {
    const calls = [];
    const connection = {
        beginTransaction: async () => calls.push('begin'),
        execute: async (sql, values) => { calls.push({ sql, values }); return [{ insertId: 7 }]; },
        commit: async () => calls.push('commit'),
        rollback: async () => calls.push('rollback'),
        release: () => calls.push('release'),
    };
    const moduleMock = { exports: {} };
    const source = readFileSync(join(__dirname, '..', 'db.js'), 'utf8');
    vm.runInNewContext(source, {
        module: moduleMock, process: { env: {} }, console,
        require: (name) => {
            if (name === './utils') return require('../utils');
            if (name === 'mysql2/promise') return { createPool: () => ({ getConnection: async () => { calls.push('connect'); return connection; } }) };
            throw new Error(`Unexpected dependency: ${name}`);
        },
    });
    await assert.rejects(moduleMock.exports.createTournament({ ...tournament(), rounds: [] }), { status: 400 });
    assert.deepEqual(calls, []);
    assert.equal(await moduleMock.exports.createTournament(tournament()), 7);
    assert.equal(calls[0], 'connect');
    assert.equal(calls[1], 'begin');
    assert.deepEqual(Array.from(calls[2].values), ['Höstcupen', 'En tävling.', 'published']);
    assert.deepEqual(Array.from(calls[3].values), [7, '2028-02-29 09:00:00', 'Hall A', 'https://example.com/results']);
    assert.deepEqual(Array.from(calls[4].values), [7, '2028-03-01 10:30:00', 'Hall B', null]);
    assert.deepEqual(calls.slice(-2), ['commit', 'release']);
});
