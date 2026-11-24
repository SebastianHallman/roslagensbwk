const { pool } = require('../db');
const { validId } = require('../utils');

// Use the stored values so existing teams also have a revision, without a schema change.
const teamVersion = 'SHA2(JSON_ARRAY(name, series), 256)';

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
    const [rows] = await pool.execute(`SELECT id, name, series, ${teamVersion} AS version FROM teams ORDER BY id`);
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

    const { version } = req.body;
    if (typeof version !== 'string' || !/^[0-9a-f]{64}$/.test(version)) {
        return res.status(409).json({ error: 'Reload the team before editing' });
    }
    const [result] = await pool.execute(
        `UPDATE teams SET name = ?, series = ? WHERE id = ? AND ${teamVersion} = ?`,
        [...values, id, version]
    );
    if (!result.affectedRows) return teamNotMatched(id, res);
    res.json({ id: Number(id) });
}

async function teamNotMatched(id, res) {
    const [rows] = await pool.execute('SELECT id FROM teams WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Entry not found' });
    return res.status(409).json({ error: 'Team has changed' });
}

async function remove(req, res) {
    const { id } = req.params;
    if (!validId(id)) return res.status(400).json({ error: 'Invalid ID' });
    const { version } = req.query;
    if (typeof version !== 'string' || !/^[0-9a-f]{64}$/.test(version)) {
        return res.status(409).json({ error: 'Reload the team before deleting' });
    }
    const [result] = await pool.execute(`DELETE FROM teams WHERE id = ? AND ${teamVersion} = ?`, [id, version]);
    if (!result.affectedRows) return teamNotMatched(id, res);
    res.json({ id: Number(id) });
}

module.exports = { list, save, remove };
