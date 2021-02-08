class MemoryStore {
    constructor(checkPeriod=86400000) { // every 24 hours
        this.sessions = new Map();
        this.interval = setInterval(() => {
            this.sessions.forEach((value, key) => {
                if (value.expirationTime && value.expirationTime < Date.now()) {
                    this.sessions.delete(key);
                }
            });
        }, checkPeriod);
    }

    addSession(sessionId, userId, pairs=null) {
        this.sessions.set(sessionId, Object.assign({ userId }, pairs));
    }

    getSession(sessionId) {
        const session = this.sessions.get(sessionId);

        if (!session) {
            return null;
        }

        if (session.expirationTime && session.expirationTime < Date.now()) {
            return null;
        }

        const userId = session.userId;
        delete session.userId;
        delete session.expirationTime;

        return {
            sessionId: sessionId,
            userId: userId,
            pairs: session
        };
    }

    setExpirationTime(sessionId, userId, timeInSeconds) {
        const data = this.sessions.get(sessionId);
        data.expirationTime = Date.now() + (timeInSeconds * 1000);

        this.sessions.set(sessionId, data);
    }

    getExpirationTime(sessionId) {
        return this.sessions.get(sessionId).expirationTime;
    }

    deleteSession(sessionId) {
        this.sessions.delete(sessionId);
    }

    deleteSessionsByUserId(userId) {
        this.sessions.forEach((value, key) => {
            if (value.userId === userId) {
                this.sessions.delete(key);

                return;
            }
        });
    }

    setPair(sessionId, key, value) {
        const data = this.sessions.get(sessionId);
        data[key] = value;

        this.sessions.set(sessionId, data);
    }

    deletePair(sessionId, key) {
        const data = this.sessions.get(sessionId);
        delete data[key];

        this.sessions.set(sessionId, data);
    }
}

module.exports = MemoryStore;
