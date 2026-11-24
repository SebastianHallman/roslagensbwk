const sharp = require('sharp');
const { pool } = require('../db');
const { validId } = require('../utils');
const sponsorVersion = 'SHA2(JSON_ARRAY(name, SHA2(image, 256)), 256)';

const maxImageBytes = 512 * 1024;
const maxImagePixels = 16_000_000;
const imagePattern = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/;

async function validImage(image) {
    if (image === null || image === undefined) return true;
    if (typeof image !== 'string') return false;
    const match = imagePattern.exec(image);
    if (!match || match[2].length % 4 !== 0) return false;
    const [, format, encoded] = match;
    const bytes = Buffer.from(encoded, 'base64');
    if (bytes.length > maxImageBytes) return false;
    try {
        const decoder = sharp(bytes, { animated: true, failOn: 'warning', limitInputPixels: maxImagePixels });
        const metadata = await decoder.metadata();
        if (metadata.format !== format) return false;
        await decoder.raw().toBuffer();
        return true;
    } catch {
        return false;
    }
}

async function list(req, res) {
    const [rows] = await pool.execute(`SELECT id, name, image IS NOT NULL AS hasImage, ${sponsorVersion} AS version FROM sponsors ORDER BY id`);
    res.json(rows);
}

async function getImage(req, res) {
    if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid ID' });
    const [rows] = await pool.execute('SELECT image FROM sponsors WHERE id = ?', [req.params.id]);
    const image = rows[0]?.image && imagePattern.exec(rows[0].image);
    if (!image) return res.status(404).json({ error: 'Image not found' });
    const [, format, encoded] = image;
    res.set('X-Content-Type-Options', 'nosniff');
    res.type('image/' + format).send(Buffer.from(encoded, 'base64'));
}

async function save(req, res) {
    const { id } = req.params;
    if (id !== undefined && !validId(id)) return res.status(400).json({ error: 'Invalid ID' });
    const { name, image } = req.body ?? {};
    if (typeof name !== 'string' || !name.trim() || name.trim().length > 150 || !(await validImage(image))) {
        return res.status(400).json({ error: 'Invalid directory entry' });
    }

    if (id === undefined) {
        const [result] = await pool.execute('INSERT INTO sponsors (name, image) VALUES (?, ?)', [name.trim(), image ?? null]);
        return res.status(201).json({ id: result.insertId });
    }

    const { version } = req.body;
    if (typeof version !== 'string' || !/^[0-9a-f]{64}$/.test(version)) {
        return res.status(409).json({ error: 'Reload the sponsor before editing' });
    }
    const condition = `WHERE id = ? AND ${sponsorVersion} = ?`;
    const [result] = image === undefined
        ? await pool.execute(`UPDATE sponsors SET name = ? ${condition}`, [name.trim(), id, version])
        : await pool.execute(`UPDATE sponsors SET name = ?, image = ? ${condition}`, [name.trim(), image, id, version]);
    if (!result.affectedRows) return sponsorNotMatched(id, res);
    res.json({ id: Number(id) });
}

async function sponsorNotMatched(id, res) {
    const [rows] = await pool.execute('SELECT id FROM sponsors WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Entry not found' });
    return res.status(409).json({ error: 'Sponsor has changed' });
}

async function remove(req, res) {
    const { id } = req.params;
    if (!validId(id)) return res.status(400).json({ error: 'Invalid ID' });
    const { version } = req.query;
    if (typeof version !== 'string' || !/^[0-9a-f]{64}$/.test(version)) {
        return res.status(409).json({ error: 'Reload the sponsor before deleting' });
    }
    const [result] = await pool.execute(`DELETE FROM sponsors WHERE id = ? AND ${sponsorVersion} = ?`, [id, version]);
    if (!result.affectedRows) return sponsorNotMatched(id, res);
    res.json({ id: Number(id) });
}

module.exports = { list, getImage, save, remove };
