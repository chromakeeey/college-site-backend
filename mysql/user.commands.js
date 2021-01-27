const connectionPool = require('./connection');

const checkIfEmailUsed = async (email) => {
    const [rows] = await connectionPool.query('SELECT EXISTS (SELECT 1 FROM user WHERE email = ?)', email)

    return Object.values(rows[0])[0] === 1;
};

const checkIfUserExists = async (userId) => {
    const [rows] = await connectionPool.query('SELECT EXISTS (SELECT 1 FROM user WHERE id = ?)', userId);

    return Object.values(rows[0])[0] === 1;
};

const addUser = async ({
    accountType,
    firstName,
    lastName,
    fatherName,
    phone,
    email,
    password,
    isActivated
}) => {
    const sql = `
        INSERT INTO
            user (account_type, last_name, first_name, father_name, phone, email, password, is_activated)
        VALUES
            (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [rows] = await connectionPool.query(sql, [
        accountType, lastName,
        firstName, fatherName,
        phone, email,
        password, isActivated
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
            user.is_activated,
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

const setLastName = async (userId, newLastName) => {
    const sql = 'UPDATE user SET last_name = ? WHERE id = ?';

    const [rows] = await connectionPool.query(sql, [
            newLastName,
            userId
    ]);

    return rows.affectedRows > 0;
}

const setFatherName = async (userId, newFatherName) => {
    const sql = 'UPDATE user SET father_name = ? WHERE id = ?';

    const [rows] = await connectionPool.query(sql, [
            newFatherName,
            userId
    ]);

    return rows.affectedRows > 0;
}

const setPhoneNumber = async (userId, newPhoneNumber) => {
    const sql = 'UPDATE user SET phone = ? WHERE id = ?';

    const [rows] = await connectionPool.query(sql, [
            newPhoneNumber,
            userId
    ]);

    return rows.affectedRows > 0;
}

const deleteUser = async (userId) => {
    const sql = 'DELETE FROM user WHERE id = ?';

    const [rows] = await connectionPool.query(sql, userId);

    return rows.affectedRows > 0;
}

const setActivationStatus = async (userId, value) => {
    const [rows] = await connectionPool.query('UPDATE user SET is_activated = ? WHERE id = ?', [
        value,
        userId
    ]);

    return rows.affectedRows > 0;
};

const getActivationStatus = async (userId) => {
    const [rows] = await connectionPool.query('SELECT EXISTS (SELECT 1 FROM user WHERE id = ? AND is_activated = 1)', userId);

    return (!rows.length) ? false : Object.values(rows[0])[0] === 1;
};

module.exports = {
    addUser,
    getUserInfo,
    checkIfEmailUsed,
    checkIfUserExists,
    getUserByEmail,
    getAccountTypeByUserId,
    setFirstName,
    setLastName,
    setFatherName,
    setPhoneNumber,
    deleteUser,
    setActivationStatus,
    getActivationStatus
}
