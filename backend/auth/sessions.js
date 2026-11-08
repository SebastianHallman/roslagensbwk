
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);

const options = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    createDatabaseTable: false,
    connectionLimit: 2
}

if (!process.env.SESSION_SECRET) throw Error("No session secret set");

const sessionStore = new MySQLStore(options)

const sessionConfig = session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
            sameSite: 'lax',
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 8*60*60*1000
    }
})

module.exports = sessionConfig;