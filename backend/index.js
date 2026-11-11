const { testConnection } = require('./db');
const express = require('express');
const cors = require('cors');
const sessionConfig = require('./auth/sessions');

const boardRoutes = require('./routes/board');
const authRoutes = require('./routes/auth');
const tournamentRoutes = require('./routes/tournaments');

const app = express();

if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

const port = process.env.PORT || 3000;
const frontendOrigin = process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : process.env.FRONTEND_URL;

app.use(cors({
    origin: frontendOrigin,
    credentials: true
}));

if (!frontendOrigin) {
    throw new Error('FRONTEND_URL is not defined in the environment variables.');
}
app.use(express.json({limit: '10kb'}));
app.use(sessionConfig);
app.use('/board', boardRoutes);
app.use('/auth', authRoutes);
app.use('/tournaments', tournamentRoutes);

app.get('/health', async (req, res) => {
    const connectionStatus = await testConnection();

    res.status(connectionStatus ? 200 : 503).json({
        server: 'up',
        database: connectionStatus ? 'up' : 'down'
    });
});


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});