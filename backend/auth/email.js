function isValidEmail(value) {
    if (typeof value !== 'string') return false;

    const email = value.trim();
    return email.length <= 254 && /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(email);
}

module.exports = { isValidEmail };
