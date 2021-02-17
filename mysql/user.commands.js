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

    if (rows[0] == undefined) {
        return -1;
    }

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

const setEmail = async (userId, email) => {
    const [rows] = await connectionPool.query('UPDATE user SET email = ? WHERE id = ?', [
        email,
        userId
    ]);

    return rows.affectedRows > 0;
};

const setPassword = async (userId, password) => {
    const [rows] = await connectionPool.query('UPDATE user SET password = ? WHERE id = ?', [
        password,
        userId
    ]);

    return rows.affectedRows > 0;
};

const getUsersCount = async ({
    isActivated,
    accountType
} = {}) => {
    const whereCaluse = (() => {
        const conditions = [];
        const values = [];
        const result = {
            'values': values,
            'conditions': ''
        };

        if (isActivated != undefined) {
            conditions.push('is_activated = ?');
            values.push(isActivated);
        }

        if (accountType != undefined) {
            conditions.push('account_type = ?');
            values.push(accountType);
        }

        if (conditions.length) {
            result.conditions = 'WHERE ' + conditions.join(' AND ');
        }

        return result;
    })();
    const sql = `
        SELECT
            COUNT(id)
        FROM
            user
        ${whereCaluse.conditions}
    `;

    const [rows] = await connectionPool.query(sql, whereCaluse.values);

    return Object.values(rows[0])[0];
};

const getUsers = async ({
    ascendingOrder,
    orderBy,
    isActivated,
    accountType,
    limit,
    offset
} = {}) => {
    const whereCaluse = (() => {
        const conditions = [];
        const values = [];
        const result = {
            'values': values,
            'conditions': ''
        };

        if (isActivated != undefined) {
            conditions.push('is_activated = ?');
            values.push(isActivated);
        }

        if (accountType != undefined) {
            conditions.push('account_type = ?');
            values.push(accountType);
        }

        if (conditions.length) {
            result.conditions = 'WHERE ' + conditions.join(' AND ');
        }

        return result;
    })();
    const limitStatement = (limit != undefined) ? `LIMIT ${limit}` : '';
    const offsetStatement = (offset != undefined) ? `OFFSET ${offset}` : '';
    const orderByClause = (() => {
        if (orderBy == undefined) {
            return '';
        }

        const ordering = (ascendingOrder === false) ? 'DESC' : 'ASC';

        return `ORDER BY ${orderBy} ${ordering}`;
    })();

    const sql = `
        SELECT
            user.id, user.first_name,
            user.last_name, user.father_name,
            user.phone, user.email,
            user.is_activated, user.account_type AS account_type_id,
            account_type.name AS account_type_name
        FROM
            user
        JOIN
            account_type
        ON
            user.account_type = account_type.id
        ${whereCaluse.conditions}
        ${orderByClause}
        ${limitStatement}
        ${offsetStatement}
    `;

    console.log(sql);
    const [rows] = await connectionPool.query(sql, whereCaluse.values);

    return rows;
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
    getActivationStatus,
    setEmail,
    setPassword,
    getUsersCount,
    getUsers,
};
