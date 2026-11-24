const { test } = require('node:test');
const assert = require('node:assert/strict');
const sharp = require('sharp');
const { pool } = require('../db');
const { save } = require('./handlers');

function dataUrl(format, bytes) {
    return `data:image/${format};base64,${bytes.toString('base64')}`;
}

async function updateSponsor(image) {
    const res = {
        statusCode: 200,
        status(code) { this.statusCode = code; return this; },
        json() {},
    };
    await save({ params: { id: '2' }, body: { name: 'Sponsor', image } }, res);
    return res.statusCode;
}

for (const format of ['png', 'jpeg', 'webp']) {
    test(`accepts a complete ${format} and rejects truncated or mislabeled replacements before writing`, async (t) => {
        const execute = t.mock.method(pool, 'execute', async () => [{ affectedRows: 1 }]);
        const bytes = await sharp({ create: { width: 32, height: 32, channels: 3, background: 'red' } })
            .toFormat(format).toBuffer();
        const image = dataUrl(format, bytes);
        assert.equal(await updateSponsor(image), 200);
        assert.deepEqual(execute.mock.calls[0].arguments[1], ['Sponsor', image, '2']);

        const signatureLength = { png: 8, jpeg: 3, webp: 12 }[format];
        assert.equal(await updateSponsor(dataUrl(format, bytes.subarray(0, signatureLength))), 400);
        assert.equal(await updateSponsor(dataUrl(format, bytes.subarray(0, Math.floor(bytes.length / 2)))), 400);
        assert.equal(await updateSponsor(dataUrl(format === 'png' ? 'jpeg' : 'png', bytes)), 400);
        assert.equal(execute.mock.callCount(), 1);
    });
}

test('rejects a JPEG with readable metadata but incomplete pixel data', async (t) => {
    t.mock.method(pool, 'execute', () => assert.fail('Unexpected database write'));
    const bytes = await sharp({ create: { width: 64, height: 64, channels: 3, background: 'red' } })
        .jpeg().toBuffer();
    const incomplete = bytes.subarray(0, -12);
    assert.equal((await sharp(incomplete).metadata()).format, 'jpeg');
    assert.equal(await updateSponsor(dataUrl('jpeg', incomplete)), 400);
});
