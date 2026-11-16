import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, SourceTextModule } from 'node:vm';

async function loadApi(fetch) {
    const context = createContext({ fetch, Error, console: { error() {} } });
    const helper = new SourceTextModule(readFileSync(new URL('../src/api/requestJson.js', import.meta.url), 'utf8'), { context });
    const api = new SourceTextModule(readFileSync(new URL('../src/api/api.js', import.meta.url), 'utf8'), {
        context,
        // Vite supplies this value in the browser; no real .env or server is used here.
        initializeImportMeta(meta) {
            meta.env = { VITE_API_URL: 'https://api.example.test' };
        }
    });
    await api.link((specifier) => {
        assert.equal(specifier, './requestJson.js');
        return helper;
    });
    await api.evaluate();
    return api.namespace;
}

for (const [name, args, path, method, credentials, data] of [
    ['signIn', ['admin@example.test', 'password'], '/signin', 'POST', 'include', { email: 'admin@example.test', password: 'password' }],
    ['signOut', [], '/signout', 'POST', 'include', undefined],
    ['getCurrentUser', [], '/me', 'GET', 'include', undefined],
    ['createAdminInvitation', ['admin@example.test'], '/invite', 'POST', 'include', { email: 'admin@example.test' }],
    ['requestPasswordReset', ['admin@example.test'], '/forgot-password', 'POST', undefined, { email: 'admin@example.test' }],
    ['redeemInvitation', ['token', 'password'], '/verify-invite', 'POST', 'include', { token: 'token', password: 'password' }],
    ['resetPassword', ['token', 'password'], '/reset-password', 'POST', undefined, { token: 'token', password: 'password' }],
]) {
    test(`${name} preserves its URL, JSON payload, credentials and result`, async () => {
        const responseBody = { user: { id: 7 }, message: 'ok' };
        let calls = 0;
        const api = await loadApi(async (url, options) => {
            calls++;
            assert.equal(url, `https://api.example.test/auth${path}`);
            assert.equal(options.method, method);
            assert.equal(options.credentials, credentials);
            assert.equal(options.body, data === undefined ? undefined : JSON.stringify(data));
            assert.equal(options.headers?.['Content-Type'], data === undefined ? undefined : 'application/json');
            assert.equal('data' in options, false);
            return Response.json(responseBody);
        });
        assert.deepEqual(await api[name](...args), name === 'getCurrentUser' ? responseBody.user : responseBody);
        assert.equal(calls, 1);
    });
}

test('current user returns null only for an HTTP 401', async () => {
    const unauthorized = await loadApi(async () => new Response('Unauthorized', { status: 401 }));
    assert.equal(await unauthorized.getCurrentUser(), null);

    const forbidden = await loadApi(async () => Response.json({ error: 'private details' }, { status: 403 }));
    await assert.rejects(forbidden.getCurrentUser(), { status: 403, message: 'HTTP error! status: 403' });
});

test('auth failures retain status and error codes without exposing server messages', async () => {
    for (const [name, status, code] of [
        ['createAdminInvitation', 409, 'ACCOUNT_EXISTS'],
        ['resetPassword', 400, 'INVALID_RESET_TOKEN'],
        ['resetPassword', 400, 'INVALID_PASSWORD'],
        ['requestPasswordReset', 429, undefined],
        ['signIn', 401, undefined],
    ]) {
        const api = await loadApi(async () => Response.json({ error: 'private details', code }, { status }));
        await assert.rejects(api[name]('value', 'password'), {
            status, code, message: `HTTP error! status: ${status}`
        });
    }
});

test('non-JSON HTTP errors still carry their status', async () => {
    const api = await loadApi(async () => new Response('<html>Unavailable</html>', { status: 503 }));
    await assert.rejects(api.resetPassword('token', 'password'), {
        status: 503, code: undefined, message: 'HTTP error! status: 503'
    });
});

test('network errors and invalid success JSON propagate to callers', async () => {
    const failure = new TypeError('Network unavailable');
    const offline = await loadApi(async () => { throw failure; });
    await assert.rejects(offline.signIn('email', 'password'), (error) => error === failure);
    await assert.rejects(offline.getCurrentUser(), (error) => error === failure);

    const invalid = await loadApi(async () => new Response('invalid JSON', { status: 200 }));
    await assert.rejects(invalid.signOut(), SyntaxError);
});

const signal = new AbortController().signal;
const member = { name: 'Test member' };
const news = { title: 'Test news' };
const tournament = { title: 'Test tournament' };

for (const [name, args, path, method, credentials, data, expectedSignal] of [
    ['fetchBoardMembers', [], '/board', undefined, undefined, undefined, undefined],
    ['fetchAdminBoardMembers', [signal], '/board/admin', 'GET', 'include', undefined, signal],
    ['addBoardMember', [member], '/board/add', 'POST', 'include', member, undefined],
    ['updateBoardMember', [7, member], '/board/7', 'PUT', 'include', member, undefined],
    ['deleteBoardMember', [7], '/board/delete/7', 'DELETE', 'include', undefined, undefined],
    ['reorderBoardMembers', [[7, 8]], '/board/reorder', 'PUT', 'include', { ids: [7, 8] }, undefined],
    ['fetchNews', [signal], '/news/published', undefined, undefined, undefined, signal],
    ['fetchAdminNews', [signal], '/news', 'GET', 'include', undefined, signal],
    ['createNews', [news], '/news/create', 'POST', 'include', { news }, undefined],
    ['updateNews', ['a/b', news], '/news/a%2Fb', 'PUT', 'include', { news }, undefined],
    ['deleteNews', ['a/b'], '/news/delete/a%2Fb', 'DELETE', 'include', undefined, undefined],
    ['fetchTournaments', [signal], '/tournaments/published', undefined, undefined, undefined, signal],
    ['fetchAdminTournaments', [signal], '/tournaments', 'GET', 'include', undefined, signal],
    ['createTournament', [tournament], '/tournaments/create', 'POST', 'include', { tournament }, undefined],
    ['updateTournament', ['a/b', tournament], '/tournaments/a%2Fb', 'PUT', 'include', { tournament }, undefined],
    ['deleteTournament', ['a/b'], '/tournaments/delete/a%2Fb', 'DELETE', 'include', undefined, undefined],
]) {
    test(`${name} preserves its request options and result`, async () => {
        const result = { ok: true };
        let calls = 0;
        const api = await loadApi(async (url, options) => {
            calls++;
            assert.equal(url, `https://api.example.test${path}`);
            assert.equal(options.method, method);
            assert.equal(options.credentials, credentials);
            assert.equal(options.body, data === undefined ? undefined : JSON.stringify(data));
            assert.equal(options.headers?.['Content-Type'], data === undefined ? undefined : 'application/json');
            assert.equal(options.signal, expectedSignal);
            assert.equal('data' in options, false);
            assert.equal('validationCode' in options, false);
            return Response.json(result);
        });
        assert.deepEqual(await api[name](...args), result);
        assert.equal(calls, 1);
    });
}

for (const [name, args, validationCode, otherCode] of [
    ['createNews', [news], 'INVALID_NEWS', 'INVALID_TOURNAMENT'],
    ['updateNews', [7, news], 'INVALID_NEWS', 'INVALID_TOURNAMENT'],
    ['deleteNews', [7], 'INVALID_NEWS', 'INVALID_TOURNAMENT'],
    ['createTournament', [tournament], 'INVALID_TOURNAMENT', 'INVALID_NEWS'],
    ['updateTournament', [7, tournament], 'INVALID_TOURNAMENT', 'INVALID_NEWS'],
    ['deleteTournament', [7], 'INVALID_TOURNAMENT', 'INVALID_NEWS'],
]) {
    test(`${name} exposes only its expected validation messages`, async () => {
        for (const [body, expectedMessage] of [
            [{ code: validationCode, error: 'Required field missing' }, 'Required field missing'],
            [{ code: otherCode, error: 'Internal details' }, 'HTTP error! status: 400'],
            [{ code: validationCode, error: { detail: 'Internal details' } }, 'HTTP error! status: 400'],
            [{ error: 'Internal details' }, 'HTTP error! status: 400'],
        ]) {
            const api = await loadApi(async () => Response.json(body, { status: 400 }));
            await assert.rejects(api[name](...args), { status: 400, code: body.code, message: expectedMessage });
        }

        const unavailable = await loadApi(async () => new Response('<html>Unavailable</html>', { status: 503 }));
        await assert.rejects(unavailable[name](...args), { status: 503, message: 'HTTP error! status: 503' });
    });
}

test('public reads keep server messages private and propagate cancellation', async () => {
    const api = await loadApi(async () => Response.json({ code: 'INVALID_NEWS', error: 'Private details' }, { status: 500 }));
    await assert.rejects(api.fetchNews(), { status: 500, message: 'HTTP error! status: 500' });

    const controller = new AbortController();
    controller.abort();
    const cancelled = await loadApi(async (url, options) => {
        assert.equal(options.signal, controller.signal);
        options.signal.throwIfAborted();
    });
    await assert.rejects(cancelled.fetchTournaments(controller.signal), (error) => error === controller.signal.reason);
});
