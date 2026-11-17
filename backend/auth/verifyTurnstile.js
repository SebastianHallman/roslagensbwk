async function verifyTurnstile(req, res, next) {
    const secret = process.env.TURNSTILE_SECRET_KEY;
    const hostname = process.env.TURNSTILE_HOSTNAME;
    if (!secret || !hostname) {
        return res.status(503).json({ error: 'Security verification is temporarily unavailable.' });
    }

    const token = req.body?.turnstileToken;
    if (typeof token !== 'string' || !token.trim() || token.length > 2048) {
        return res.status(400).json({ error: 'Security verification is required.', code: 'INVALID_CAPTCHA' });
    }

    try {
        const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ secret, response: token }),
            signal: AbortSignal.timeout(5000),
        });
        if (!response.ok) throw new Error('Turnstile service failed');

        const result = await response.json();
        if (
            result?.success !== true ||
            result.hostname !== hostname ||
            result.action !== 'contact'
        ) {
            return res.status(400).json({ error: 'Security verification failed.', code: 'INVALID_CAPTCHA' });
        }
    } catch {
        // Never include the submitted token or secret in responses or logs.
        return res.status(503).json({ error: 'Security verification is temporarily unavailable.' });
    }

    return next();
}

module.exports = verifyTurnstile;
