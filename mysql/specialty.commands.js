const connectionPool = require('./connection');

const getSpecialties = async () => {
    const [rows] = await connectionPool.query('SELECT * FROM specialty');

    return rows;
};

module.exports = {
    getSpecialties,
};
