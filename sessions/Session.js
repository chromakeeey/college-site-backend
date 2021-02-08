const crypto = require('crypto');
const uid = require('uid-safe');
const cookie = require('cookie-signature');

const generateSessionId = async () => {
    return await uid(32);
};

const hashSessionId = (sessionId) => {
    return crypto.createHash('sha1')
        .update(sessionId, 'utf8')
        .digest('hex');
};

class Session {
    constructor(res, config, sessionData=null) {
        this.res = res;
        this.store = config.store;
        this.config = config;
        
        if (sessionData) {
            this.sessionId = sessionData.sessionId;
            this.userId = sessionData.userId;
            this.pairs = sessionData.pairs;

            return;
        }

        [this.sessionId, this.userId, this.pairs] = [null, null, null];
    }

    async setPair(key, value) {
        await this.store.setPair(this.sessionId, key, value);
    }

    async deletePair(key) {
        await this.store.deletePair(this.sessionId, key);
    }

    exists() {
        return this.sessionId != null;
    }

    async init(userId, pairs=null) {
        if (this.sessionId) {
            return;
        }

        const plainSessionId = await this.config.sessionGenerator();
        this.sessionId = this.config.hashFunction(plainSessionId + this.config.secret);
        this.userId = userId;
        this.pairs = (!pairs) ? {} : pairs;

        this.res.cookie('session', cookie.sign(plainSessionId, this.config.secret), {
            maxAge: this.config.expirationTime,
            httpOnly: this.config.httpOnly
        });

        await this.store.addSession(this.sessionId, userId, pairs);
        await this.store.setExpirationTime(this.sessionId, this.userId, this.config.expirationTime);
    }

    async delete() {
        this.res.removeHeader('set-cookie');

        await this.store.deleteSession(this.sessionId);
    }
}

module.exports = {
    generateSessionId,
    hashSessionId,
    Session,
};
