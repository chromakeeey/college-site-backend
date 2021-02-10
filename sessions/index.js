const Cookie = require('./Cookie');
const cookie = require('cookie-signature');
const {
    Session,
    generateSessionId,
    hashSessionId
} = require('./Session');

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

const getSessionDataIfExists = async (sessionId, config) => {
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
        const cookies = Cookie.parse(req.headers.cookie);
        const sessionId = cookies.session ? cookie.unsign(cookies.session, config.secret) : null;
        const sessionData = await getSessionDataIfExists(sessionId, config);

        if (sessionData) {
            res.cookie('session', cookie.sign(sessionId, secret), {
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

module.exports = middleware;
