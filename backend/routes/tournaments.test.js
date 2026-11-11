const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');
const express = require('express');
const { validateTournament, validateTournamentUpdate } = require('../tournaments/validation');

function loadModule(file, dependencies) {
    const moduleMock = { exports: {} };
    const factory = vm.runInThisContext(`(function(require, module, console) {\n${readFileSync(file, 'utf8')}\n})`, { filename: file });
    factory((name) => {
        if (Object.hasOwn(dependencies, name)) return dependencies[name];
        throw new Error(`Unexpected dependency: ${name}`);
    }, moduleMock, { error() {} });
    return moduleMock.exports;
}

test('PUT /tournaments/:id: authorization, validation and responses', async (t) => {
    const calls = [];
    let result = true;
    let failure;
    const db = {
        getUserById: async (id) => ({ id, role: id === 1 ? 'admin' : 'member' }),
        updateTournament: async (id, input) => {
            calls.push({ id, input });
            validateTournamentUpdate(input);
            if (failure) throw failure;
            return result;
        },
    };
    const requireAdmin = loadModule(join(__dirname, '..', 'auth', 'requireAdmin.js'), { '../db': db });
    const router = loadModule(join(__dirname, 'tournaments.js'), {
        express, '../db': db, '../auth/requireAdmin': requireAdmin,
    });
    const app = express();
    app.use(express.json());
    app.use((req, res, next) => {
        // Session simulation exists only in this test server.
        if (req.headers['x-test-user']) req.session = { userId: Number(req.headers['x-test-user']) };
        next();
    });
    app.use('/tournaments', router);
    const server = app.listen(0, '127.0.0.1');
    t.after(() => new Promise((resolve) => { server.close(resolve); server.closeAllConnections(); }));
    await new Promise((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
    const valid = {
        title: 'Cup', description: 'Tournament', status: 'published',
        rounds: [{ id: 21, starts_at: '2028-02-29 09:00:00', venue: 'Hall A', results_url: '' }],
        removed_round_ids: [22],
    };
    const send = (id, body = { tournament: valid }, user = 1) => fetch(
        `http://127.0.0.1:${server.address().port}/tournaments/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...(user ? { 'x-test-user': String(user) } : {}) },
            body: JSON.stringify(body),
        },
    );

    await t.test('requires an admin before processing input', async () => {
        assert.equal((await send('bad', {}, null)).status, 401);
        assert.equal((await send('7', {}, 2)).status, 403);
        assert.equal(calls.length, 0);
    });
    await t.test('rejects invalid path IDs before calling the database', async () => {
        for (const id of ['abc', '0', '-1', '1.5', '4294967296', '7junk', '1e2']) {
            const response = await send(id);
            assert.equal(response.status, 400);
            assert.equal((await response.json()).code, 'INVALID_TOURNAMENT');
        }
        assert.equal(calls.length, 0);
    });
    await t.test('returns validation errors for missing or invalid input', async () => {
        for (const body of [{}, { tournament: null }, { tournament: { ...valid, title: '' } }]) {
            const response = await send('7', body);
            assert.equal(response.status, 400);
            assert.equal((await response.json()).code, 'INVALID_TOURNAMENT');
        }
    });
    await t.test('passes round IDs and explicit removals to the update function', async () => {
        const response = await send('7');
        assert.equal(response.status, 200);
        assert.deepEqual(await response.json(), { id: 7 });
        assert.deepEqual(calls.at(-1), { id: 7, input: valid });
    });
    await t.test('returns 404 when the tournament does not exist', async () => {
        result = false;
        const response = await send('7');
        assert.equal(response.status, 404);
        assert.deepEqual(await response.json(), { error: 'Tournament not found' });
        result = true;
    });
    await t.test('returns database ownership validation errors as 400', async () => {
        failure = Object.assign(new Error('Round does not belong to this tournament.'), {
            status: 400, code: 'INVALID_TOURNAMENT',
        });
        const response = await send('7');
        assert.equal(response.status, 400);
        assert.deepEqual(await response.json(), { error: failure.message, code: failure.code });
    });
    await t.test('hides internal errors behind a generic 500 response', async () => {
        failure = new Error('Private database details');
        const response = await send('7');
        assert.equal(response.status, 500);
        assert.deepEqual(await response.json(), { error: 'Internal Server Error' });
    });
});

test('POST /tournaments/create: adminskydd, validering och svar', async (t) => {
    const saved = [];
    let createCalls = 0;
    let failSaving = false;
    const db = {
        getUserById: async (id) => id === 1 ? { id, role: 'admin' } : id === 2 ? { id, role: 'member' } : null,
        getTournaments: async () => [],
        createTournament: async (input) => {
            createCalls++;
            const validated = validateTournament(input);
            if (failSaving) throw new Error('Private database details');
            saved.push(validated);
            return 7;
        },
    };
    const requireAdmin = loadModule(join(__dirname, '..', 'auth', 'requireAdmin.js'), { '../db': db });
    const router = loadModule(join(__dirname, 'tournaments.js'), {
        express, '../db': db, '../auth/requireAdmin': requireAdmin,
    });
    const app = express();
    app.use(express.json());
    app.use((req, res, next) => {
        // Sessioner simuleras bara i denna isolerade testserver.
        if (req.headers['x-test-user']) req.session = { userId: Number(req.headers['x-test-user']) };
        next();
    });
    app.use('/tournaments', router);
    const server = app.listen(0, '127.0.0.1');
    t.after(() => new Promise((resolve) => { server.close(resolve); server.closeAllConnections(); }));
    await new Promise((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
    const url = `http://127.0.0.1:${server.address().port}/tournaments/create`;
    const valid = {
        title: ' Höstcupen ', description: ' En tävling ', status: 'published',
        rounds: [{ starts_at: '2028-02-29 09:00:00', venue: ' Hall A ', results_url: '' }],
    };
    const send = (body, user) => fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(user ? { 'x-test-user': String(user) } : {}) },
        body: JSON.stringify(body),
    });

    await t.test('ingen session ger 401 och annan roll ger 403 före create-anropet', async () => {
        assert.equal((await send({ tournament: valid })).status, 401);
        assert.equal((await send({ tournament: valid }, 2)).status, 403);
        assert.equal(createCalls, 0);
    });

    await t.test('saknad body eller tournament samt ogiltiga fält ger 400 utan sparande', async () => {
        const invalidBodies = [
            undefined, {}, { tournament: null }, { tournament: [] },
            { tournament: { ...valid, title: ' ' } },
            { tournament: { ...valid, status: 'unknown' } },
            { tournament: { ...valid, rounds: [] } },
            { tournament: { ...valid, rounds: [{ ...valid.rounds[0], starts_at: '2027-02-29 09:00:00' }] } },
            { tournament: { ...valid, rounds: [{ ...valid.rounds[0], results_url: 'javascript:alert(1)' }] } },
        ];
        for (const body of invalidBodies) {
            const response = await send(body, 1);
            assert.equal(response.status, 400);
            const result = await response.json();
            assert.equal(result.code, 'INVALID_TOURNAMENT');
            assert.equal(typeof result.error, 'string');
        }
        assert.equal(saved.length, 0);
    });

    await t.test('giltiga indata ger 201 med id och normaliserade värden', async () => {
        const response = await send({ tournament: valid }, 1);
        assert.equal(response.status, 201);
        assert.deepEqual(await response.json(), { id: 7 });
        assert.equal(saved.length, 1);
        assert.equal(saved[0].title, 'Höstcupen');
        assert.equal(saved[0].rounds[0].venue, 'Hall A');
        assert.equal(saved[0].rounds[0].results_url, null);
    });

    await t.test('databasfel ger 500 utan att lämna ut interna detaljer', async () => {
        failSaving = true;
        const response = await send({ tournament: valid }, 1);
        assert.equal(response.status, 500);
        assert.deepEqual(await response.json(), { error: 'Internal Server Error' });
        assert.equal(saved.length, 1);
    });
});
