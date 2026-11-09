const { getUserByEmail } = require('../db');
const { verifyPassword } = require('./passwords');

const DUMMY_PASSWORD_HASH = '$argon2id$v=19$m=19456,t=2,p=1$U2GRCID2ICPH9EXVQKG6kg$rzEuliTMaBpokz8Bkz8jcwBvIPnCMsJcAk+BxMVZSnI';

async function authenticateAdmin(email, password) {
    const user = await getUserByEmail(email);
    
    const passwordHash = user ? user.password_hash : DUMMY_PASSWORD_HASH;
    const isMatch = await verifyPassword(passwordHash, password);

    if (!user || !isMatch || user.role !== 'admin') {
        return null;
    }

    return {
        id: user.id,
        email: user.email,
        role: user.role,
    };
}

module.exports = {
    authenticateAdmin,
};