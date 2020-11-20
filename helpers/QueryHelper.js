const { connectionPool } = require('../mysql/connection');

class Query {
    constructor(sql, params=[]) {
        this.sql = sql;
        this.params = params;
        this.process = null;
        this.preprocess = null;
        this.ifEmpty = null;
    }
}

class Result {
    constructor(result) {
        [this.rows, this.fields] = result;
        this.insertId = (this.rows.insertId !== undefined) ? this.rows.insertId : null;
    }

    isEmpty() {
        return !this.rows[0];
    }

    getValue() {
        return this.rows[0][this.fields[0].name];
    }
}

class QueryHelper {
    constructor(query) {
        this.queries = [query];
        this.currentQuery = query;
        this.processAllCallback = null;
    }

    withParams() {
        this.currentQuery.params = Array.from(arguments);

        return this;
    }

    preprocess(callback) {
        this.currentQuery.preprocess = callback;

        return this;
    }

    process(callback) {
        this.currentQuery.process = callback;

        return this;
    }

    processAll(callback) {
        this.processAllCallback = callback;

        return this;
    }

    ifEmpty(callback) {
        this.currentQuery.ifEmpty = callback;

        return this;
    }

    async commit() {
        const results = [];
        const connection = await connectionPool.getConnection();

        for (let i = 0; i < this.queries.length; i++) {
            let result = new Result(await connection.query(this.queries[i].sql, this.queries[i].params));

            if (result.isEmpty() && this.queries[i].ifEmpty) {
                this.queries[i].ifEmpty(this.proceed);

                return;
            }

            if (this.queries[i].preprocess) {
                result = await this.queries[i].preprocess(result, this.proceed);
            }

            if (this.queries[i].process) {
                await this.queries[i].process(result, this.proceed);
            }

            results.push(result);
        }

        await connection.release();

        if (this.processAllCallback && results) {
            this.processAllCallback(...results);
        }
    }

    query(sql) {
        const query = new Query(sql);

        this.queries.push(query);
        this.currentQuery = query;

        return this;
    }

    static query(sql) {
        const query = new Query(sql);

        return new QueryHelper(query);
    }
};

module.exports = QueryHelper
