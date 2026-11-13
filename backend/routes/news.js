const express = require('express');
const { validId } = require('../utils');
const { getNews, createNews, updateNews, deleteNews } = require('../db');
const requireAdmin = require('../auth/requireAdmin');

const router = express.Router();

router.get('/published', async (req, res) => {
    try {
        res.json(await getNews('published'));
    } catch (error) {
        console.error('Error fetching published news:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/', requireAdmin, async (req, res) => {
    try {
        res.json(await getNews());
    } catch (error) {
        console.error('Error fetching news:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/create', requireAdmin, async (req, res) => {
    const { news } = req.body ?? {};
    try {
        const id = await createNews(news);
        res.status(201).json({ id });
    } catch (error) {
        if (error.status === 400 && error.code === 'INVALID_NEWS') {
            return res.status(400).json({ error: error.message, code: error.code });
        }
        console.error('Error creating news:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.put('/:id', requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    if (!validId(req.params.id)) {
        return res.status(400).json({
            error: 'News ID must be a positive integer within the INT UNSIGNED range.',
            code: 'INVALID_NEWS',
        });
    }
    const { news } = req.body ?? {};
    try {
        const updated = await updateNews(id, news);
        if (!updated) return res.status(404).json({ error: 'News not found' });
        res.json({ id });
    } catch (error) {
        if (error.status === 400 && error.code === 'INVALID_NEWS') {
            return res.status(400).json({ error: error.message, code: error.code });
        }
        console.error('Error updating news:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.delete('/delete/:id', requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    if (!validId(req.params.id)) {
        return res.status(400).json({
            error: 'News ID must be a positive integer within the INT UNSIGNED range.',
            code: 'INVALID_NEWS',
        });
    }
    try {
        const deleted = await deleteNews(id);
        if (!deleted) return res.status(404).json({ error: 'News not found' });
        res.json({ message: 'News deleted successfully' });
    } catch (error) {
        console.error('Error deleting news:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
