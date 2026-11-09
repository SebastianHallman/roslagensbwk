const express = require('express');
const { getBoardMembers, addBoardMember, deleteBoardMember } = require('../db');
const requireAdmin = require('../auth/requireAdmin');
const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const members = await getBoardMembers();
        res.json(members);
    } catch (error) {
        console.error('Error fetching board members:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/add', requireAdmin, async (req, res) => {
    const { name, role, sortOrder } = req.body;

    if (!name || !role || typeof sortOrder !== 'number') {
        return res.status(400).json({ error: 'Invalid board member data' });
    }

    try {
        const memberId = await addBoardMember(name, role, sortOrder);
        res.status(201).json({ id: memberId });
    } catch (error) {
        console.error('Error adding board member:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.delete('/delete/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const success = await deleteBoardMember(id);
        if (success) {
            res.status(200).json({ message: 'Board member deleted successfully' });
        }
        else {
            res.status(404).json({ error: 'Board member not found' });
        }
    } catch (error) {
        console.error('Error deleting board member:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});



module.exports = router;