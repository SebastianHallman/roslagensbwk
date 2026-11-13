const express = require('express');

const jsonBody = express.Router();

// Multiple rounds and their result links can exceed the general request limit.
jsonBody.use('/tournaments', express.json({ limit: '1mb' }));
// Fits 10,000 body + 150 title code points, even as escaped surrogate pairs.
jsonBody.use('/news', express.json({ limit: '128kb' }));
jsonBody.use(express.json({ limit: '10kb' }));

module.exports = jsonBody;
