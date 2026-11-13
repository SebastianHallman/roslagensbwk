const mysql = require('mysql2/promise');
const { formatTournamentJSON, validId, validateTournament, validateTournamentUpdate, validateNews } = require('./utils');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 5,
});

async function testConnection() {
    
     try {
        await pool.execute('SELECT 1');
        return true;
    } catch (error) {
        console.error('Database connection failed:', error);
        return false;
    }
}

// MEMBERS

async function getBoardMembers() {
    const [rows] = await pool.execute('SELECT * FROM board_members WHERE is_visible = TRUE ORDER BY sort_order, id');
    return rows;
}

async function addBoardMember(name, role, sortOrder) {
    const [result] = await pool.execute(
        'INSERT INTO board_members (name, role, sort_order) VALUES (?, ?, ?)',
        [name, role, sortOrder]
    );
    return result.insertId;
}

async function getAdminBoardMembers() {
    const [rows] = await pool.execute('SELECT * FROM board_members ORDER BY sort_order, id');
    return rows;
}

async function updateBoardMember(id, name, role, sortOrder, isVisible) {
    const [result] = await pool.execute(
        'UPDATE board_members SET name = ?, role = ?, sort_order = ?, is_visible = ? WHERE id = ?',
        [name, role, sortOrder, isVisible, id]
    );
    if (result.affectedRows > 0) return true;
    const [rows] = await pool.execute('SELECT id FROM board_members WHERE id = ?', [id]);
    return rows.length > 0;
}

async function reorderBoardMembers(ids) {
    if (!Array.isArray(ids) ||
        !ids.every((id) => Number.isInteger(id) && validId(id)) ||
        new Set(ids).size !== ids.length) {
        return false;
    }

    const orderedIds = [...ids];
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [rows] = await connection.execute(
            'SELECT id FROM board_members ORDER BY id FOR UPDATE'
        );
        const requestedIds = new Set(orderedIds);
        if (rows.length !== orderedIds.length || !rows.every((row) => requestedIds.has(row.id))) {
            await connection.rollback();
            return false;
        }

        for (let order = 0; order < orderedIds.length; order++) {
            await connection.execute(
                'UPDATE board_members SET sort_order = ? WHERE id = ?',
                [order, orderedIds[order]]
            );
        }

        await connection.commit();
        return true;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

async function deleteBoardMember(id) {
    const [result] = await pool.execute(
        'DELETE FROM board_members WHERE id = ?',
        [id]
    );
    return result.affectedRows > 0;
}


// ADMIN
async function createAdminInvitation(email, tokenHash) {
    const [result] = await pool.execute(
        `INSERT INTO admin_email_whitelist (
            email,
            invitation_token_hash,
            invitation_expires_at
        )
        VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 1 DAY))
        ON DUPLICATE KEY UPDATE
            invitation_token_hash = ?,
            invitation_expires_at = DATE_ADD(UTC_TIMESTAMP(), INTERVAL 1 DAY)`,
        [email, tokenHash, tokenHash]
    );

    return result.insertId;
}



async function getUserByEmail(email) {
    const [rows] = await pool.execute(
        'SELECT * FROM users WHERE email = ?',
        [email]
    );
    return rows[0] ?? null;
}

async function getUserById(id) {
 
    const [rows] = await pool.execute(
        'SELECT id, email, role FROM users WHERE id = ?',
        [id]
    );
    return rows[0] ?? null;
}

async function redeemAdminInvitation(email, tokenHash, passwordHash) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [validInvite] = await connection.execute(
            'SELECT * FROM admin_email_whitelist WHERE email = ? AND invitation_token_hash = ? AND invitation_expires_at > UTC_TIMESTAMP() FOR UPDATE', [email, tokenHash]
        );

        if (validInvite.length === 0) {
            await connection.rollback();
            return null;
        }

    

        
        await connection.execute(
            'DELETE FROM admin_email_whitelist WHERE id = ?',
        [validInvite[0].id]);

        const user = await connection.execute(
            'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)',
            [email, passwordHash, "admin"]
        )

        await connection.commit();
        return user[0].insertId ?? null;
        
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}


// TOURNAMENTS

async function createTournament(tournament) {
    const validated = validateTournament(tournament);
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();
        const t = await connection.execute(
            'INSERT INTO tournaments (title, description, status) VALUES (?, ?, ?)',
         [validated.title, validated.description, validated.status]);

        for (const round of validated.rounds) {
            await connection.execute(
                'INSERT INTO rounds (tournament_id, starts_at, venue, results_url) VALUES (?, ?, ?, ?)',
             [t[0].insertId, round.starts_at, round.venue, round.results_url ?? null])
        }

        await connection.commit();
        return t[0].insertId;

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        await connection.release();
    }

}

async function deleteTournament(id) {

    const [result] = await pool.execute('DELETE FROM tournaments WHERE id = ?', [id]);

    return result.affectedRows > 0;
    
}

async function updateTournament(id, tournament) {
    if (!Number.isInteger(id) || !validId(id)) {
        const error = new Error('Tournament ID must be a positive integer within the INT UNSIGNED range.');
        error.status = 400;
        error.code = 'INVALID_TOURNAMENT';
        throw error;
    }
    const validated = validateTournamentUpdate(tournament);
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();
        const [rows] = await connection.execute(
            'SELECT id FROM tournaments WHERE id = ? FOR UPDATE',
            [id]
        );
        if (rows.length === 0) {
            await connection.rollback();
            return false;
        }

        const [existingRounds] = await connection.execute(
            'SELECT id FROM rounds WHERE tournament_id = ? FOR UPDATE',
            [id]
        );
        const existingIds = new Set(existingRounds.map((round) => round.id));
        const referencedIds = [
            ...validated.rounds.filter((round) => round.id !== undefined).map((round) => round.id),
            ...validated.removed_round_ids,
        ];
        const hasForeignRound = referencedIds.some((roundId) => !existingIds.has(roundId));
        const finalRoundCount = existingIds.size - validated.removed_round_ids.length +
            validated.rounds.filter((round) => round.id === undefined).length;
        if (hasForeignRound || (validated.status === 'published' && finalRoundCount === 0)) {
            const error = new Error(hasForeignRound
                ? 'All round IDs must belong to the tournament being updated.'
                : 'A published tournament must have at least one round.');
            error.status = 400;
            error.code = 'INVALID_TOURNAMENT';
            throw error;
        }

        await connection.execute(
            'UPDATE tournaments SET title = ?, description = ?, status = ? WHERE id = ?',
            [validated.title, validated.description, validated.status, id]
        );
        for (const round of validated.rounds) {
            if (round.id !== undefined) {
                await connection.execute(
                    'UPDATE rounds SET starts_at = ?, venue = ?, results_url = ? WHERE id = ? AND tournament_id = ?',
                    [round.starts_at, round.venue, round.results_url, round.id, id]
                );
            } else {
                await connection.execute(
                    'INSERT INTO rounds (tournament_id, starts_at, venue, results_url) VALUES (?, ?, ?, ?)',
                    [id, round.starts_at, round.venue, round.results_url]
                );
            }
        }
        for (const roundId of validated.removed_round_ids) {
            await connection.execute('DELETE FROM rounds WHERE id = ? AND tournament_id = ?', [roundId, id]);
        }

        await connection.commit();
        return true;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

async function getTournaments(status = null) {
    if (status !== null && status !== 'draft' && status !== 'published') {
        const error = new Error('Status must be draft, published or null.');
        error.status = 400;
        throw error;
    }
    const onlyByStatus = status === null ? '' : 'WHERE t.status = ?';
    const parameters = status === null ? [] : [status];
    const [rows] = await pool.execute(
        "SELECT t.id AS tournament_id, t.title, t.description, t.status, r.id AS round_id, DATE_FORMAT(r.starts_at, '%Y-%m-%d %H:%i:%s') AS starts_at, r.venue, r.results_url FROM tournaments AS t LEFT JOIN rounds AS r ON r.tournament_id = t.id " + onlyByStatus + ' ORDER BY r.starts_at, r.id',
        parameters
    );
    return formatTournamentJSON(rows);

}

// news

async function getNews(status = null) {
    if (status !== null && status !== 'draft' && status !== 'published') {
        const error = new Error('Status must be draft, published or null.');
        error.status = 400;
        throw error;
    }
    const onlyByStatus = status === null ? '' : 'WHERE status = ?';
    const parameters = status === null ? [] : [status];
    const [rows] = await pool.execute(
        "SELECT id, title, DATE_FORMAT(date, '%Y-%m-%d') AS date, body, status, DATE_FORMAT(updated, '%Y-%m-%d %H:%i:%s') AS updated FROM news " + onlyByStatus + ' ORDER BY date DESC, id DESC',
        parameters
    );
    return rows;
}

async function createNews(news) {
    const validated = validateNews(news);
    const date = validated.status === 'published'
        ? new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Stockholm' })
        : null;
    const [result] = await pool.execute(
        'INSERT INTO news (title, date, body, status) VALUES (?, ?, ?, ?)',
        [validated.title, date, validated.body, validated.status]
    );
    return result.insertId;
}

async function updateNews(id, news) {
    if (!Number.isInteger(id) || !validId(id)) {
        const error = new Error('News ID must be a positive integer within the INT UNSIGNED range.');
        error.status = 400;
        error.code = 'INVALID_NEWS';
        throw error;
    }
    const validated = validateNews(news);
    const date = validated.status === 'published'
        ? new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Stockholm' })
        : null;
    const [result] = await pool.execute(
        'UPDATE news SET title = ?, date = COALESCE(date, ?), body = ?, status = ? WHERE id = ?',
        [validated.title, date, validated.body, validated.status, id]
    );
    if (result.affectedRows > 0) return true;
    const [rows] = await pool.execute('SELECT id FROM news WHERE id = ?', [id]);
    return rows.length > 0;
}


async function deleteNews(id) {
    if (!Number.isInteger(id) || !validId(id)) {
        const error = new Error('News ID must be a positive integer within the INT UNSIGNED range.');
        error.status = 400;
        error.code = 'INVALID_NEWS';
        throw error;
    }
    const [result] = await pool.execute('DELETE FROM news WHERE id = ?', [id]);
    return result.affectedRows > 0;
}

module.exports = {
    testConnection,
    getBoardMembers,
    getAdminBoardMembers,
    updateBoardMember,
    reorderBoardMembers,
    getUserById,
    createAdminInvitation,
    getUserByEmail,
    addBoardMember,
    deleteBoardMember,
    redeemAdminInvitation,
    createTournament,
    updateTournament,
    getTournaments,
    deleteTournament,
    getNews,
    createNews,
    updateNews,
    deleteNews
};

