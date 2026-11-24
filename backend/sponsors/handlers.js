const { pool } = require('../db');
const { validId } = require('../utils');

const maxImageBytes = 512 * 1024;
const imagePattern = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/;

function validImage(image) {
    if (image === null || image === undefined) return true;
    if (typeof image !== 'string') return false;
    const match = imagePattern.exec(image);
    if (!match || match[2].length % 4 !== 0) return false;
    const [, format, encoded] = match;
    const bytes = Buffer.from(encoded, 'base64');
    if (bytes.length > maxImageBytes) return false;
    switch (format) {
        case 'png': return bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'));
        case 'jpeg': return bytes.subarray(0, 3).equals(Buffer.from('ffd8ff', 'hex'));
        case 'webp': return bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
    }
}

async function list(req, res) {
    const [rows] = await pool.execute('SELECT id, name, image IS NOT NULL AS hasImage FROM sponsors ORDER BY id');
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
    if (typeof name !== 'string' || !name.trim() || name.trim().length > 150 || !validImage(image)) {
        return res.status(400).json({ error: 'Invalid directory entry' });
    }

    if (id === undefined) {
        const [result] = await pool.execute('INSERT INTO sponsors (name, image) VALUES (?, ?)', [name.trim(), image ?? null]);
        return res.status(201).json({ id: result.insertId });
    }

    const [result] = image === undefined
        ? await pool.execute('UPDATE sponsors SET name = ? WHERE id = ?', [name.trim(), id])
        : await pool.execute('UPDATE sponsors SET name = ?, image = ? WHERE id = ?', [name.trim(), image, id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Entry not found' });
    res.json({ id: Number(id) });
}

async function remove(req, res) {
    if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid ID' });
    const [result] = await pool.execute('DELETE FROM sponsors WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Entry not found' });
    res.json({ id: Number(req.params.id) });
}

module.exports = { list, getImage, save, remove };
