const connectionPool = require('./connection');

const getListOfAccountTypes = async() => {
    const [rows] = await connectionPool.query('SELECT * FROM `account_type`');

    return rows;
};

module.exports = {
    getListOfAccountTypes,
};