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

async function addBoardMember(name, role, sortOrder) {
    const [result] = await pool.execute(
        'INSERT INTO board_members (name, role, sort_order) VALUES (?, ?, ?)',
        [name, role, sortOrder]
    );
    return result.insertId;
}

async function deleteBoardMember(id) {
    const [result] = await pool.execute(
        'DELETE FROM board_members WHERE id = ?',
        [id]
    );
    return result.affectedRows > 0;
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


module.exports = {
    testConnection,
    getBoardMembers,
    getUserById,
    createAdminInvitation,
    updateInviteTokenHash,
    getUserByEmail,
    addBoardMember,
    deleteBoardMember,
    redeemAdminInvitation
};

