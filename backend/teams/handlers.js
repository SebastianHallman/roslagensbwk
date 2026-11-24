const { pool } = require('../db');
const { validId } = require('../utils');

function shortText(value, limit) {
    return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= limit;
}

function normalizeSeriesLink(value) {
    if (value === '') return '';
    if (typeof value !== 'string' || value.length > 2048) return null;
    const input = value.trim();
    let address = input;
    if (input.startsWith('//')) {
        address = 'https:' + input;
    } else if (!/^https?:/i.test(input)) {
        // A hostname may include a port. Resolve it independently of the club website.
        if (!/^(?:\[[\da-f:.]+\]|[^\s:/?#@\\]+)(?::\d+)?(?:[/?#]|$)/i.test(input)) return null;
        address = 'https://' + input;
    }
    try {
        const url = new URL(address);
        if (url.hostname === '.' || url.hostname === '..') return null;
        const absolute = /^https?:\/\//i.test(address) ? address : url.href;
        return absolute.length <= 2048 ? absolute : null;
    } catch {
        return null;
    }
}

async function list(req, res) {
    const [rows] = await pool.execute('SELECT id, name, series FROM teams ORDER BY id');
    res.json(rows.map((row) => {
        const series = typeof row.series === 'string' ? JSON.parse(row.series) : row.series;
        return { ...row, series: series.map((entry) => ({ ...entry, url: normalizeSeriesLink(entry.url) ?? '' })) };
    }));
}

async function save(req, res) {
    const { id } = req.params;
    if (id !== undefined && !validId(id)) return res.status(400).json({ error: 'Invalid ID' });
    const { name, series } = req.body ?? {};
    if (!shortText(name, 150) || !Array.isArray(series) || series.length > 20) {
        return res.status(400).json({ error: 'Invalid directory entry' });
    }

    const normalizedSeries = [];
    for (const entry of series) {
        const url = normalizeSeriesLink(entry?.url);
        if (!shortText(entry?.name, 150) || url === null) {
            return res.status(400).json({ error: 'Invalid directory entry' });
        }
        normalizedSeries.push({ name: entry.name.trim(), url });
    }
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
