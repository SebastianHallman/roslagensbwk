const express = require('express');
const contactLimiter = require('../auth/contactLimiter');
const verifyTurnstile = require('../auth/verifyTurnstile');
const { isValidEmail } = require('../auth/email');
const sendMail = require('../email/sendEmail');
const { escapeHtml } = require('../utils');

if (!process.env.CONTACT_TO_EMAIL) throw Error('CONTACT_TO_EMAIL not set');

const router = express.Router();

router.post('/', contactLimiter, verifyTurnstile, async (req, res) => {
    const { name, email, message } = req.body ?? {};
    if (
        typeof name !== 'string' || !name.trim() || name.trim().length > 100 ||
        !isValidEmail(email) || /[\r\n]/.test(email) ||
        typeof message !== 'string' || !message.trim() || message.trim().length > 2000
    ) {
        return res.status(400).json({
            error: 'Name (up to 100 characters), valid email and message (up to 2,000 characters) are required.',
        });
    }

    // The browser cannot choose the recipient or the template.
    const recipient = process.env.CONTACT_TO_EMAIL;
    if (!isValidEmail(recipient) || /[\r\n]/.test(recipient)) {
        return res.status(503).json({ error: 'Contact form is temporarily unavailable. Try again later.' });
    }

    try {
        await sendMail(recipient.trim(), 'bwk-kontaktformular', {
            CONTACT_NAME: escapeHtml(name.trim()),
            CONTACT_EMAIL: escapeHtml(email.trim()),
            CONTACT_MESSAGE: escapeHtml(message.trim()),
        }, { replyTo: email.trim() });
        return res.status(200).json({ message: 'Tack! Ditt meddelande har skickats till klubben.' });
    } catch {
        console.error('Contact email delivery failed.');
        return res.status(502).json({ error: 'Message could not be sent. Try again later.' });
    }
});

module.exports = router;
