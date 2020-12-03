class RedisStore {
    constructor(redisClient) {
        this.redisClient = redisClient;
    }

    async addSession(sessionId, userId, pairs=null) {
        const pipeline = this.redisClient.pipeline();

        if (!pairs) {
            pipeline.hset(sessionId, 'user_id', userId);
        } else {
            const newPairs = [];

            Object.entries(pairs).forEach((pair) => {
                const [key, value] = pair;

                newPairs.push(key);
                newPairs.push(JSON.stringify(value));
            });

            pipeline.hset(sessionId, 'user_id', userId, ...newPairs);
        }

        pipeline.zadd(userId, Date.now(), sessionId);

        const results = await pipeline.exec();
        results.forEach((result) => {
            const [error] = result;

            if (error) {
                throw error;
            }
        });
    }

    async getSession(sessionId) {
        const data = await this.redisClient.hgetall(sessionId);

        if (!Object.entries(data).length) {
            return null;
        }

        const pairs = {};

        for (const key in data) {
            pairs[key] = JSON.parse(data[key]);
        }

        const userId = pairs.user_id;
        delete pairs.user_id;

        return {
            sessionId: sessionId,
            userId: userId,
            pairs: pairs
        };
    }

    async setExpirationTime(sessionId, userId, timeInSeconds) {
        if (timeInSeconds < 0) {
            return;
        }

        const pipeline = this.redisClient.pipeline();
        pipeline.expire(sessionId, timeInSeconds);
        pipeline.expire(userId, timeInSeconds);
        pipeline.zadd(userId, Date.now(), sessionId);
        // removing expired sessions if any
        pipeline.zremrangebyscore(userId, '-inf', Date.now() - (timeInSeconds * 1000));

        const results = await pipeline.exec();
        results.forEach((result) => {
            const [error] = result;

            if (error) {
                throw error;
            }
        });
    }

    async getExpirationTime(sessionId) {
        return await this.redisClient.ttl(sessionId);
    }

    // delete all sessions that belong to the user behind this sessionId
    async deleteSession(sessionId) {
        const userId = await this.redisClient.hget(sessionId, 'user_id');

        if (!userId) {
            return;
        }

        await this.deleteSessionsByUserId(userId);
    }

    // delete all sessions that belong to this userId
    async deleteSessionsByUserId(userId) {
        const sessions = await this.redisClient.zrange(userId, 0, -1);

        if (!sessions.length) {
            return;
        }

        await this.redisClient.del(...sessions.concat(userId));
    }

    async setPair(sessionId, key, value) {
        await this.redisClient.hset(sessionId, key, value);
    }

    async deletePair(sessionId, key) {
        await this.redisClient.hdel(sessionId, key);
    }
}

module.exports = RedisStore
