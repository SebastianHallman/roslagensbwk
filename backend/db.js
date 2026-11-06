const mysql = require('mysql2/promise');

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

async function getBoardMembers() {
    const [rows] = await pool.execute('SELECT * FROM board_members WHERE is_visible = TRUE ORDER BY sort_order, id');
    return rows;
}



async function createAdminInvitation(email, tokenHash) {
    const [result] = await pool.execute(
        `INSERT INTO admin_email_whitelist (
            email,
            invitation_token_hash,
            invitation_expires_at
        )
        VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 1 DAY))`,
        [email, tokenHash]
    );

    return result.insertId;
}

async function updateInviteTokenHash(email, tokenHash) {
    const [result] = await pool.execute(
        `UPDATE admin_email_whitelist
        SET invitation_token_hash = ?, invitation_expires_at = DATE_ADD(UTC_TIMESTAMP(), INTERVAL 1 DAY)
        WHERE email = ?`,
        [tokenHash, email]
    );
    return result.affectedRows > 0;
}

async function getUserByEmail(email) {
    const [rows] = await pool.execute(
        'SELECT * FROM users WHERE email = ?',
        [email]
    );
    return rows[0] ?? null;
}

module.exports = {
    testConnection,
    getBoardMembers,
    createAdminInvitation,
    updateInviteTokenHash,
    getUserByEmail,
};

