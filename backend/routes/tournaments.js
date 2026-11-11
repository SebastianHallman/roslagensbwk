const {validId} = require('../utils');
const express = require('express');
const { getTournaments, createTournament, updateTournament, deleteTournament } = require('../db');
const requireAdmin = require('../auth/requireAdmin');

const router = express.Router();

router.get('/published', async (req, res) => {
    try {
        res.json(await getTournaments('published'));
    } catch (error) {
        console.error('Error fetching published tournaments:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }  
})

router.post('/create', requireAdmin, async (req, res) => {
    const { tournament } = req.body ?? {};
    try {
        // createTournament validerar uppgifterna innan någon databasanslutning hämtas.
        const id = await createTournament(tournament);
        res.status(201).json({ id });
    } catch (error) {
        if (error.status === 400 && error.code === 'INVALID_TOURNAMENT') {
            return res.status(400).json({ error: error.message, code: error.code });
        }
        console.error('Error creating tournament:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.put('/:id', requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    if (!/^[1-9]\d*$/.test(req.params.id) || !Number.isInteger(id) || id > 4294967295) {
        return res.status(400).json({
            error: 'Tournament ID must be a positive integer within the UNSIGNED INT range.',
            code: 'INVALID_TOURNAMENT',
        });
    }
    const { tournament } = req.body ?? {};
    try {
        const updated = await updateTournament(id, tournament);
        if (!updated) return res.status(404).json({ error: 'Tournament not found' });
        res.json({ id });
    } catch (error) {
        if (error.status === 400 && error.code === 'INVALID_TOURNAMENT') {
            return res.status(400).json({ error: error.message, code: error.code });
        }
        console.error('Error updating tournament:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.delete('/delete/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    if (!validId(id)) return res.status(400).json({ error: 'Invalid tournament ID' });
    try {
        const success = await deleteTournament(id);
        if (success) {
            res.status(200).json({ message: 'Tournament deleted successfully' });
        }
        else {
            res.status(404).json({ error: 'Tournament not found' });
        }
    } catch (error) {
        console.error('Error deleting tournament:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/', requireAdmin, async (req, res) => {
    try {
        res.json(await getTournaments());
    } catch (error) {
        console.error('Error fetching published tournaments:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }  
})

module.exports = router;
