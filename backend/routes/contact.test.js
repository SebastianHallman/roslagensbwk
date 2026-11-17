const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');
const express = require('express');
const createAuthLimiter = require('../auth/createAuthLimiter');
const emailValidation = require('../auth/email');
const jsonBody = require('../jsonBody');
const utils = require('../utils');

function load(file, dependencies, env, fetchMock) {
    const module = { exports: {} };
    const factory = vm.runInThisContext(`(function(require, module, process, console, fetch) {\n${readFileSync(file, 'utf8')}\n})`, { filename: file });
    factory((name) => {
        if (Object.hasOwn(dependencies, name)) return dependencies[name];
        throw new Error(`Unexpected dependency: ${name}`);
    }, module, { env }, { error() {} }, fetchMock);
    return module.exports;
}

async function setup(t, { verification, verificationError, verificationOk = true, invalidJson = false } = {}) {
    const env = {
        RESEND_API_KEY: 'test-key', FROM_EMAIL: 'Club <sender@example.com>', CONTACT_TO_EMAIL: 'club@example.com',
        TURNSTILE_SECRET_KEY: 'test-secret', TURNSTILE_HOSTNAME: 'localhost',
    };
    const calls = [];
    const verificationCalls = [];
    let fail = false;
    class FakeResend {
        constructor() {
            this.emails = { send: async (payload) => {
                calls.push(payload);
                return fail ? { error: { message: 'Private provider error' } } : { data: { id: 'accepted' } };
            } };
        }
    }
    const sendMail = load(join(__dirname, '..', 'email', 'sendEmail.js'), { resend: { Resend: FakeResend } }, env);
    const contactLimiter = load(join(__dirname, '..', 'auth', 'contactLimiter.js'), {
        './createAuthLimiter': createAuthLimiter,
    }, env);
    const verifyTurnstile = load(join(__dirname, '..', 'auth', 'verifyTurnstile.js'), {}, env, async (url, options) => {
        verificationCalls.push({ url, options });
        if (verificationError) throw verificationError;
        return {
            ok: verificationOk,
            json: async () => {
                if (invalidJson) throw new SyntaxError('Private response details');
                return verification === undefined ? { success: true, hostname: 'localhost', action: 'contact' } : verification;
            },
        };
    });
    const router = load(join(__dirname, 'contact.js'), {
        express, '../auth/contactLimiter': contactLimiter, '../auth/email': emailValidation,
        '../auth/verifyTurnstile': verifyTurnstile,
        '../email/sendEmail': sendMail,
        '../utils': utils,
    }, env);
    const app = express();
    app.use(jsonBody);
    app.use('/contact', router);
    const server = app.listen(0, '127.0.0.1');
    t.after(() => new Promise((resolve) => { server.close(resolve); server.closeAllConnections(); }));
    await new Promise((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
    const send = (body) => fetch(`http://127.0.0.1:${server.address().port}/contact`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    return { send, calls, env, sendMail, verificationCalls, fail: () => { fail = true; } };
}

const valid = { name: 'Visitor', email: 'visitor@example.com', message: 'Hello club!', turnstileToken: 'test-token' };

test('contact uses fixed recipient and template, escapes HTML, and sets Reply-To', async (t) => {
    const { send, calls, sendMail, verificationCalls } = await setup(t);
    const response = await send({
        name: ' <b>Visitor</b> ', email: ' visitor@example.com ', message: ' Hello & welcome\n<script>"test"</script> ',
        to: 'attacker@example.com', templateId: 'other-template', from: 'spoof@example.com',
        turnstileToken: valid.turnstileToken,
    });
    assert.equal(response.status, 200);
    assert.equal(verificationCalls.length, 1);
    assert.equal(verificationCalls[0].url, 'https://challenges.cloudflare.com/turnstile/v0/siteverify');
    assert.equal(verificationCalls[0].options.method, 'POST');
    assert.deepEqual(JSON.parse(verificationCalls[0].options.body), { secret: 'test-secret', response: 'test-token' });
    assert.ok(verificationCalls[0].options.signal instanceof AbortSignal);
    assert.deepEqual(calls[0], {
        from: 'Club <sender@example.com>', to: ['club@example.com'], replyTo: 'visitor@example.com',
        template: { id: 'bwk-kontaktformular', variables: {
            CONTACT_NAME: '&lt;b&gt;Visitor&lt;/b&gt;', CONTACT_EMAIL: 'visitor@example.com',
            CONTACT_MESSAGE: 'Hello &amp; welcome\n&lt;script&gt;&quot;test&quot;&lt;/script&gt;',
        } },
    });
    // Existing auth callers must still work without the new optional argument.
    await sendMail('admin@example.com', 'bwk-admininbjudan', { INVITE_URL: 'https://example.com/invite' });
    assert.equal(Object.hasOwn(calls[1], 'replyTo'), false);
});

test('contact rejects invalid fields without sending email', async (t) => {
    for (const body of [null, { turnstileToken: valid.turnstileToken }, { ...valid, name: ' ' }, { ...valid, name: 'x'.repeat(101) },
        { ...valid, email: 'invalid' }, { ...valid, email: 'a@example.com\r\nBcc:x@example.com' },
        { ...valid, message: [] }, { ...valid, message: ' ' }, { ...valid, message: 'x'.repeat(2001) }]) {
        await t.test(JSON.stringify(body).slice(0, 80), async (t) => {
            const { send, calls } = await setup(t);
            const response = await send(body);
            assert.equal(response.status, 400);
            // Express rejects a top-level null before the contact handler runs.
            if (body !== null) {
                assert.deepEqual(await response.json(), {
                    error: 'Name (up to 100 characters), valid email and message (up to 2,000 characters) are required.',
                });
            }
            assert.equal(calls.length, 0);
        });
    }
});

test('contact accepts maximum field lengths', async (t) => {
    const { send } = await setup(t);
    assert.equal((await send({ ...valid, name: 'x'.repeat(100), message: 'x'.repeat(2000) })).status, 200);
});

test('contact refuses missing recipient configuration and hides provider errors', async (t) => {
    const ctx = await setup(t);
    delete ctx.env.CONTACT_TO_EMAIL;
    const unavailable = await ctx.send(valid);
    assert.equal(unavailable.status, 503);
    assert.deepEqual(await unavailable.json(), { error: 'Contact form is temporarily unavailable. Try again later.' });
    assert.equal(ctx.calls.length, 0);
    ctx.env.CONTACT_TO_EMAIL = 'club@example.com';
    ctx.fail();
    const response = await ctx.send(valid);
    assert.equal(response.status, 502);
    assert.deepEqual(await response.json(), { error: 'Message could not be sent. Try again later.' });
});

test('contact rate limits attempts before sending additional email', async (t) => {
    const { send, calls, verificationCalls } = await setup(t);
    for (let i = 0; i < 5; i++) assert.equal((await send(valid)).status, 200);
    const response = await send(valid);
    assert.equal(response.status, 429);
    assert.deepEqual(await response.json(), { error: 'Too many contact attempts. Try again later.' });
    assert.equal(response.headers.get('ratelimit-limit'), '5');
    assert.equal(response.headers.get('ratelimit-policy'), '5;w=900');
    assert.ok(Number(response.headers.get('retry-after')) > 0);
    assert.equal(calls.length, 5);
    assert.equal(verificationCalls.length, 5);
});

test('contact rejects missing and malformed Turnstile tokens before external calls', async (t) => {
    const ctx = await setup(t);
    for (const turnstileToken of [undefined, '', ' ', 123, 'x'.repeat(2049)]) {
        const response = await ctx.send({ ...valid, turnstileToken });
        assert.equal(response.status, 400);
        assert.deepEqual(await response.json(), { error: 'Security verification is required.', code: 'INVALID_CAPTCHA' });
    }
    assert.equal(ctx.calls.length, 0);
    assert.equal(ctx.verificationCalls.length, 0);
});

test('contact blocks rejected, expired, replayed and mismatched Turnstile responses', async (t) => {
    for (const verification of [
        { success: false, 'error-codes': ['invalid-input-response'] },
        { success: false, 'error-codes': ['timeout-or-duplicate'] },
        { success: true, hostname: 'other.example.com', action: 'contact' },
        { success: true, hostname: 'localhost', action: 'signin' },
        { success: true, hostname: 'localhost' },
        { success: 'true', hostname: 'localhost', action: 'contact' },
        {}, null,
    ]) {
        await t.test(JSON.stringify(verification), async (t) => {
            const ctx = await setup(t, { verification });
            const response = await ctx.send(valid);
            assert.equal(response.status, 400);
            assert.deepEqual(await response.json(), { error: 'Security verification failed.', code: 'INVALID_CAPTCHA' });
            assert.equal(ctx.calls.length, 0);
        });
    }
});

test('contact blocks email if Turnstile fails or is not configured', async (t) => {
    for (const options of [
        { verificationOk: false }, { invalidJson: true },
        { verificationError: new Error('Private network details') },
        { verificationError: new DOMException('Timed out', 'TimeoutError') },
        { missing: 'TURNSTILE_SECRET_KEY' }, { missing: 'TURNSTILE_HOSTNAME' },
    ]) {
        await t.test(JSON.stringify(options), async (t) => {
            const ctx = await setup(t, options);
            if (options.missing) delete ctx.env[options.missing];
            const response = await ctx.send(valid);
            assert.equal(response.status, 503);
            assert.deepEqual(await response.json(), { error: 'Security verification is temporarily unavailable.' });
            assert.equal(ctx.calls.length, 0);
            if (options.missing) assert.equal(ctx.verificationCalls.length, 0);
        });
    }
});
