const express = require('express');
const { getBoardMembers } = require('../db');

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const members = await getBoardMembers();
        res.json(members);
    } catch (error) {
        console.error('Error fetching board members:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

);
module.exports = router;