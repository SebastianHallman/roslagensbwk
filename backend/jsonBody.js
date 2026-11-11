const express = require('express');

const jsonBody = express.Router();

// Multiple rounds and their result links can exceed the general request limit.
jsonBody.use('/tournaments', express.json({ limit: '1mb' }));
jsonBody.use(express.json({ limit: '10kb' }));

module.exports = jsonBody;
