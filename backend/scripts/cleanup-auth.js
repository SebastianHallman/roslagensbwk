async function cleanupExpiredAuth(pool) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [invitations] = await connection.execute(
            'DELETE FROM admin_email_whitelist WHERE invitation_expires_at <= UTC_TIMESTAMP()'
        );
        const [passwordResets] = await connection.execute(
            'DELETE FROM password_reset_tokens WHERE expires_at <= UTC_TIMESTAMP()'
        );
        const [sessions] = await connection.execute(
            'DELETE FROM sessions WHERE expires <= UNIX_TIMESTAMP()'
        );
        await connection.commit();
        return {
            invitations: invitations.affectedRows,
            passwordResets: passwordResets.affectedRows,
            sessions: sessions.affectedRows,
        };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

async function main() {
    const mysql = require('mysql2/promise');
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        connectionLimit: 1,
    });
    try {
        const counts = await cleanupExpiredAuth(pool);
        console.log('Expired auth records removed:', counts);
    } finally {
        await pool.end();
    }
}

if (require.main === module) {
    main().catch(() => {
        console.error('Auth cleanup failed. Check database connectivity and applied migrations.');
        process.exitCode = 1;
    });
}

module.exports = { cleanupExpiredAuth };
