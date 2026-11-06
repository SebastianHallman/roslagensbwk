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

module.exports = { testConnection, getBoardMembers };