const connectionPool = require('./connection');

const getListOfAccountTypes = async() => {
    const [rows] = await connectionPool.query('SELECT * FROM `account_type`');

    return rows;
};

const isExists = async (id) => {
    const [rows] = await connectionPool.query('SELECT EXISTS (SELECT 1 FROM account_type WHERE id = ?)', id);

    return Object.values(rows[0])[0] === 1;
};


module.exports = {
    getListOfAccountTypes,
    isExists,
};
