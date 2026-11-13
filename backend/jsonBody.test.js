const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const jsonBody = require('./jsonBody');
const { validateNews } = require('./utils');

test('news parser accepts maximum valid text and retains bounded request limits', async (t) => {
    const app = express();
    app.use(jsonBody);
    app.post('/news/create', (req, res) => res.json(validateNews(req.body.news)));
    app.put('/news/:id', (req, res) => res.json(validateNews(req.body.news)));
    app.post('/auth/login', (req, res) => res.sendStatus(200));
    app.use((error, req, res, next) => res.sendStatus(error.status || 500));
    const server = app.listen(0, '127.0.0.1');
    t.after(() => new Promise((resolve) => {
        server.close(resolve);
        server.closeAllConnections();
    }));
    await new Promise((resolve, reject) => {
        server.once('listening', resolve);
        server.once('error', reject);
    });
    const send = (path, method, body) => fetch(`http://127.0.0.1:${server.address().port}${path}`, {
        method, headers: { 'Content-Type': 'application/json' }, body,
    });

    for (const character of ['å', '🎳', '\u0001']) {
        const news = { title: character.repeat(150), body: character.repeat(10000), status: 'published' };
        // Exercise both UTF-8 and the largest JSON representation of each code point.
        for (const body of [JSON.stringify({ news }), JSON.stringify({ news }).replace(/[\u007f-\uffff]/g,
            (unit) => '\\u' + unit.charCodeAt(0).toString(16).padStart(4, '0'))]) {
            assert.ok(Buffer.byteLength(body) > 10 * 1024);
            for (const [path, method] of [['/news/create', 'POST'], ['/news/1', 'PUT']]) {
                const response = await send(path, method, body);
                assert.equal(response.status, 200);
                assert.deepEqual(await response.json(), news);
            }
        }
    }
    assert.equal((await send('/news/create', 'POST', JSON.stringify({ news: { body: 'x'.repeat(128 * 1024) } }))).status, 413);
    assert.equal((await send('/auth/login', 'POST', JSON.stringify({ value: 'x'.repeat(11000) }))).status, 413);
});
