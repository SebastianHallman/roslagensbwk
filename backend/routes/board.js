const express = require('express');
const { getBoardMembers, getAdminBoardMembers, addBoardMember, updateBoardMember, deleteBoardMember, reorderBoardMembers } = require('../db');
const requireAdmin = require('../auth/requireAdmin');
const { validMember, validId } = require('../utils');
const router = express.Router();

router.get('/admin', requireAdmin, async (req, res) => {
    try {
        res.json(await getAdminBoardMembers());
    } catch (error) {
        console.error('Error fetching admin board members:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

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
    const { name, role, sortOrder } = req.body ?? {};

    if (!validMember(name, role, sortOrder)) {
        return res.status(400).json({ error: 'Invalid board member data' });
    }

    try {
        const memberId = await addBoardMember(name.trim(), role.trim(), sortOrder);
        res.status(201).json({ id: memberId });
    } catch (error) {
        console.error('Error adding board member:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.put('/reorder', requireAdmin, async (req, res) => {
    const { ids } = req.body ?? {};
    if (!Array.isArray(ids) ||
        !ids.every((id) => Number.isInteger(id) && id > 0 && id <= 4294967295) ||
        new Set(ids).size !== ids.length) {
        return res.status(400).json({ error: 'Invalid board member IDs' });
    }

    try {
        const success = await reorderBoardMembers(ids);
        if (!success) {
            return res.status(409).json({ error: 'Board has changed. Reload and try again.' });
        }
        res.status(200).json({ message: 'Reorder successful' });
    } catch (error) {
        console.error('Error reordering board members:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }

});


router.delete('/delete/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    if (!validId(id)) return res.status(400).json({ error: 'Invalid board member ID' });
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


router.put('/:id', requireAdmin, async (req, res) => {
    const { name, role, sortOrder, isVisible } = req.body ?? {};
    if (!validId(req.params.id) || !validMember(name, role, sortOrder) || typeof isVisible !== 'boolean') {
        return res.status(400).json({ error: 'Invalid board member data' });
    }
    try {
        const success = await updateBoardMember(Number(req.params.id), name.trim(), role.trim(), sortOrder, isVisible);
        if (!success) return res.status(404).json({ error: 'Board member not found' });
        res.json({ message: 'Board member updated successfully' });
    } catch (error) {
        console.error('Error updating board member:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


module.exports = router;
