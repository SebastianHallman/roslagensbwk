const express = require('express');
const requireAdmin = require('../auth/requireAdmin');
const handlers = require('../sponsors/handlers');

const router = express.Router();
const parseEntry = express.json({ limit: '800kb' });

router.get('/', handlers.list);
router.get('/:id/image', handlers.getImage);
router.post('/', requireAdmin, parseEntry, handlers.save);
router.put('/:id', requireAdmin, parseEntry, handlers.save);
router.delete('/:id', requireAdmin, handlers.remove);

module.exports = router;
