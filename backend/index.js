const express = require('express');
const app = express();
const { testConnection } = require('./db');
const port = process.env.PORT || 3000;
const cors = require('cors');

const frontendOrigin = process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : process.env.FRONTEND_URL;
const boardRoutes = require('./routes/board');


app.use(cors({
    origin: frontendOrigin
}));

if (!frontendOrigin) {
    throw new Error('FRONTEND_URL is not defined in the environment variables.');
}

app.use('/board', boardRoutes)


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