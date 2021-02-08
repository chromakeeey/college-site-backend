const bcrypt = require('bcrypt');

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS);

class HashHelper {
    static async hash(password) {
        const salt = await bcrypt.genSalt(SALT_ROUNDS);

        return await bcrypt.hash(password, salt);
    }

    static async compare(text, hash) {
        return await bcrypt.compare(text, hash);
    }
}

module.exports = HashHelper;
