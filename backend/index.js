const { testConnection } = require('./db');
const express = require('express');
const cors = require('cors');
const sessionConfig = require('./auth/sessions');

const boardRoutes = require('./routes/board');
const authRoutes = require('./routes/auth');

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

app.get('/health', async (req, res) => {
    const connectionStatus = await testConnection();

    res.status(connectionStatus ? 200 : 503).json({
        server: 'up',
        database: connectionStatus ? 'up' : 'down'
    });
});

app.get('/ip', (req, res) => {
    res.status(200).json({ip: req.ip, remoteAddress: req.socket.remoteAddress});
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});