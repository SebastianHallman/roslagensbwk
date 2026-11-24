const { createHash } = require('node:crypto');
const { pool } = require('../db');

async function createDirectoryEntry(res, type, requestId, insertSql, values) {
    if (typeof requestId !== 'string' || !/^[0-9a-f]{32}$/.test(requestId)) {
        return res.status(400).json({ error: 'Invalid draft ID' });
    }
    const hash = createHash('sha256').update(JSON.stringify(values)).digest();
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        // The unique key serializes competing requests, including an original still in flight.
        await connection.execute(
            'INSERT INTO directory_create_requests (entry_type, request_id, payload_hash) VALUES (?, UNHEX(?), ?) ON DUPLICATE KEY UPDATE entry_id = entry_id',
            [type, requestId, hash]
        );
        const [[record]] = await connection.execute(
            'SELECT entry_id, payload_hash FROM directory_create_requests WHERE entry_type = ? AND request_id = UNHEX(?) FOR UPDATE',
            [type, requestId]
        );
        if (record.entry_id !== null) {
            await connection.commit();
            return res.status(200).json({ id: record.entry_id, reviewExisting: !hash.equals(record.payload_hash) });
        }
        const [result] = await connection.execute(insertSql, values);
        await connection.execute(
            'UPDATE directory_create_requests SET entry_id = ? WHERE entry_type = ? AND request_id = UNHEX(?)',
            [result.insertId, type, requestId]
        );
        await connection.commit();
        return res.status(201).json({ id: result.insertId });
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

module.exports = { createDirectoryEntry };
