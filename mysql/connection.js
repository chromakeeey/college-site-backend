const mysql = require("mysql2")

const connectionPool = mysql.createPool({
    host: '95.217.23.218',
    user: 'bleach02_pltdb',
    password: 'polytechcv202027',
    database: 'bleach02_polytechd',
    connectionLimit: 10,
});

module.exports = {
	connectionPool
}
