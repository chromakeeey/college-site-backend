const crypto = require('crypto');
const uid = require('uid-safe');
const cookie = require('cookie-signature');
const Cookie = require('./Cookie');

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

const sessionProxyHandler = {
    get: function (target, prop, receiver) {
        if (target.pairs && target.pairs.hasOwnProperty(prop)) {
            return target.pairs[prop];
        }

        return target[prop];
    },

    set: async function (target, prop, value) {
        if (target.hasOwnProperty(prop)) {
            target[prop] = value;
            
            return true;
        }

        if (target.pairs) {
            target.pairs[prop] = value;

            await target.setPair(prop, value);

            return true;
        }

        return false;
    },

    deleteProperty: async function (target, key) {
        if (target.pairs.hasOwnProperty(key)) {
            delete target.pairs[key];
            await target.deletePair(key);

            return true;
        }

        return false;
    }
};

const getSessionDataIfExists = async (cookieHeader, config) => {
    const cookies = Cookie.parse(cookieHeader);

    if (!cookies.session) {
        return null;
    }

    const sessionId = cookie.unsign(cookies.session, config.secret);

    if (!sessionId) {
        return null;
    }

    return await config.store.getSession(config.hashFunction(sessionId + config.secret));
};

const middleware = ({
    secret,
    store,
    httpOnly = true,
    expirationTime = -1,
    sessionGenerator = generateSessionId,
    hashFunction = hashSessionId
} = {}) => {
    const config = {
        secret: secret,
        httpOnly: httpOnly,
        expirationTime: expirationTime,
        store: store,
        sessionGenerator: sessionGenerator,
        hashFunction: hashFunction
    };

    return async (req, res, next) => {
        const sessionData = await getSessionDataIfExists(req.headers.cookie, config);

        if (sessionData) {
            res.cookie('session', cookie.sign(sessionData.sessionId, secret), {
                maxAge: expirationTime,
                httpOnly: httpOnly
            });
    
            await store.setExpirationTime(sessionData.sessionId, sessionData.userId, config.expirationTime);
        }

        const session = new Session(res, config, sessionData);
        req.session = new Proxy(session, sessionProxyHandler);

        next();
    }
};

module.exports = middleware
