const { connectionPool } = require('./connection');

const checkIfEmailUsed = async (email) => {
    const [rows] = await connectionPool.query('SELECT EXISTS (SELECT 1 FROM user WHERE email = ?)', email)

    return Object.values(rows[0])[0] === 1;
};

const checkIfUserExists = async (userId) => {
    const [rows] = await connectionPool.query('SELECT EXISTS (SELECT 1 FROM user WHERE id = ?)', userId);

    return Object.values(rows[0])[0] === 1;
};

const addUser = async (user) => {
    const sql = `
        INSERT INTO
            user (account_type, last_name, first_name, father_name, phone, email, password)
        VALUES
            (?, ?, ?, ?, ?, ?, ?)
    `;
    const [rows] = await connectionPool.query(sql, [
        user.account_type,
        user.last_name,
        user.first_name,
        user.father_name,
        user.phone,
        user.email,
        user.password
    ]);

    return rows.insertId;
}

const getAccountTypeByUserId = async (userId) => {
    const [rows] = await connectionPool.query('SELECT account_type FROM user WHERE id = ?', userId);

    return Number(rows[0].account_type);
};

const getUserByEmail = async (email) => {
    const [rows] = await connectionPool.query('SELECT * FROM user WHERE email = ?', email);

    return rows[0];
};

const getUserInfo = async (userId) => {
    const sql = `
        SELECT
            user.id,
            user.first_name,
            user.last_name,
            user.father_name,
            user.phone,
            user.email,
            user.account_type AS account_type_id,
            account_type.name AS account_type_name
        FROM
            user, account_type
        WHERE
            user.id = ?
        AND
            user.account_type = account_type.id
    `;
    const [rows] = await connectionPool.query(sql, userId);

    return rows[0];
};

const setFirstName = async (userId, newFirstName) => {
    const sql = 'UPDATE user SET first_name = ? WHERE id = ?';

    const [rows] = await connectionPool.query(sql, [
        newFirstName,
        userId
    ]);

    return rows.affectedRows > 0;
}

module.exports = {
    addUser,
    getUserInfo,
    checkIfEmailUsed,
    checkIfUserExists,
    getUserByEmail,
    getAccountTypeByUserId,
    setFirstName,
}
