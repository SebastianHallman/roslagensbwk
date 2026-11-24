const { test } = require('node:test');
const assert = require('node:assert/strict');
const { pool } = require('../db');
const { list, save } = require('./handlers');

test('stores absolute results links when creating and updating a team', async (t) => {
    const execute = t.mock.method(pool, 'execute', async () => [{ insertId: 1, affectedRows: 1 }]);
    const body = { name: 'Team', series: [
        { name: 'First', url: 'https:example.org/results' },
        { name: 'Second', url: 'http://example.org/series?q=1#results' },
        { name: 'Third', url: '' },
        { name: 'Fourth', url: 'example.org/results?q=1#scores' },
        { name: 'Fifth', url: 'results.example.org:8443/scores' },
    ] };
    const res = { status() { return this; }, json() {} };
    for (const params of [{}, { id: '1' }]) {
        await save({ params, body: params.id ? { ...body, version: 'a'.repeat(64) } : body }, res);
        const [, values] = execute.mock.calls.at(-1).arguments;
        const urls = JSON.parse(values[1]).map((entry) => entry.url);
        assert.deepEqual(urls, [
            'https://example.org/results', body.series[1].url, '',
            'https://example.org/results?q=1#scores', 'https://results.example.org:8443/scores',
        ]);
    }
});

test('updates only the team revision the editor opened and distinguishes a deleted team', async (t) => {
    const version = 'a'.repeat(64);
    let exists = true;
    const execute = t.mock.method(pool, 'execute', async (sql, values) => {
        if (sql.startsWith('UPDATE')) {
            assert.match(sql, /WHERE id = \? AND SHA2\(JSON_ARRAY\(name, series\), 256\) = \?/);
            assert.deepEqual(values.slice(-2), ['1', version]);
            return [{ affectedRows: 0 }];
        }
        assert.equal(sql, 'SELECT id FROM teams WHERE id = ?');
        return [exists ? [{ id: 1 }] : []];
    });
    const req = { params: { id: '1' }, body: { name: 'New name', series: [] } };
    const res = { status(code) { this.statusCode = code; return this; }, json() {} };
    await save(req, res);
    assert.equal(res.statusCode, 409);
    assert.equal(execute.mock.callCount(), 0);

    req.body.version = version;
    await save(req, res);
    assert.equal(res.statusCode, 409);
    exists = false;
    await save(req, res);
    assert.equal(res.statusCode, 404);
});

test('returns absolute links for previously stored series in either MySQL JSON format', async (t) => {
    const series = [{ name: 'Series', url: 'https:example.org/results' }];
    t.mock.method(pool, 'execute', async () => [[{ series }, { series: JSON.stringify(series) }]]);
    await list({}, { json(rows) {
        assert.deepEqual(rows.map((row) => row.series[0].url), [
            'https://example.org/results', 'https://example.org/results',
        ]);
    } });
});

test('rejects relative and non-HTTP results links before writing', async (t) => {
    const execute = t.mock.method(pool, 'execute', () => assert.fail('Unexpected database write'));
    for (const url of ['/results', '../results', '?series=1', 'ftp://example.org/results']) {
        const res = { status(code) { this.statusCode = code; return this; }, json() {} };
        await save({ params: {}, body: { name: 'Team', series: [{ name: 'Series', url }] } }, res);
        assert.equal(res.statusCode, 400);
    }
    assert.equal(execute.mock.callCount(), 0);
});
