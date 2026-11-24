const { pool } = require('../db');
const { validId } = require('../utils');

function shortText(value, limit) {
    return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= limit;
}

function seriesLink(value) {
    if (value === '') return true;
    if (typeof value !== 'string' || value.length > 2048) return false;
    try {
        return ['https:', 'http:'].includes(new URL(value).protocol);
    } catch {
        return false;
    }
}

async function list(req, res) {
    const [rows] = await pool.execute('SELECT id, name, series FROM teams ORDER BY id');
    res.json(rows.map((row) => typeof row.series === 'string' ? { ...row, series: JSON.parse(row.series) } : row));
}

async function save(req, res) {
    const { id } = req.params;
    if (id !== undefined && !validId(id)) return res.status(400).json({ error: 'Invalid ID' });
    const { name, series } = req.body ?? {};
    if (!shortText(name, 150) || !Array.isArray(series) || series.length > 20 ||
        !series.every((entry) => shortText(entry?.name, 150) && seriesLink(entry.url))) {
        return res.status(400).json({ error: 'Invalid directory entry' });
    }

    const normalizedSeries = series.map((entry) => ({
        name: entry.name.trim(),
        url: entry.url.trim()
    }));
    const values = [name.trim(), JSON.stringify(normalizedSeries)];
    if (id === undefined) {
        const [result] = await pool.execute('INSERT INTO teams (name, series) VALUES (?, ?)', values);
        return res.status(201).json({ id: result.insertId });
    }

    const [result] = await pool.execute('UPDATE teams SET name = ?, series = ? WHERE id = ?', [...values, id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Entry not found' });
    res.json({ id: Number(id) });
}

async function remove(req, res) {
    if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid ID' });
    const [result] = await pool.execute('DELETE FROM teams WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Entry not found' });
    res.json({ id: Number(req.params.id) });
}

module.exports = { list, save, remove };
