const connectionPool = require('./connection');

const getSpecialties = async () => {
    const [rows] = await connectionPool.query('SELECT * FROM specialty');

    return rows;
};

const isExists = async (specialtyId) => {
    const [rows] = await connectionPool.query('SELECT EXISTS (SELECT 1 FROM specialty WHERE id = ?)', specialtyId);

    return Object.values(rows[0])[0] === 1;
};

module.exports = {
    getSpecialties,
    isExists,
};
