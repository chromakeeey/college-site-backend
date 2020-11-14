const { connectionPool } = require('./connection')

const queryHelper = (sql, data=[], preprocess) => {
    return new Promise((resolve, reject) => {
        connectionPool.query(sql, data, (err, result) => {
            if (err) {
                console.error(err);

                reject(err);
            } else {
                resolve(preprocess(result));
            }
        });
    });
};

const checkIfEmailUsed = (email) => {
    const command = 'SELECT EXISTS (SELECT 1 FROM user WHERE email = ?)';

    return queryHelper(command, email, (result) => (result.length === 0) ? false : Object.values(result[0])[0] === 1);
};

const checkIfUserExists = (userId) => {
    const command = 'SELECT EXISTS (SELECT 1 FROM user WHERE id = ?)';

    return queryHelper(command, userId, (result) => (result.length === 0) ? false : Object.values(result[0])[0] === 1);
};

const addUser = (user) => {
    const command = 'INSERT INTO user (account_type, last_name, first_name, father_name, phone, email, password) VALUES (?, ?, ?, ?, ?, ?, ?)';
    const queryData = [
        user.account_type,
        user.last_name,
        user.first_name,
        user.father_name,
        user.phone,
        user.email,
        user.password
    ];

    return queryHelper(command, queryData, (result) => result.insertId);
}

const getAccountTypeByUserId = (userId) => {
    const command = 'SELECT account_type FROM user WHERE id = ? ';

    return queryHelper(command, userId, (result) => Number(result[0].account_type));
};

const getUserByEmail = (email) => {
    const command = 'SELECT * FROM user WHERE email = ?';

    return queryHelper(command, email, (result) => result[0]);
};

const isStudentAccountActivated = (userId) => {
    const command = 'SELECT EXISTS (SELECT 1 FROM student WHERE user_id = ? AND is_activated = 1)';

    return queryHelper(command, userId, (result) => (result.length === 0) ? false : Object.values(result[0])[0] === 1);
};

const setStudentActivation = (userId, value) => {
    const command = 'UPDATE student SET is_activated = ? WHERE user_id = ?';

    return queryHelper(command, [value, userId], (result) => true);
};

const addStudentData = (data) => {
    const command = 'INSERT INTO student (user_id, group_id, is_activated) VALUES (?, ?, ?)';
    const queryData = [
        data.user_id,
        data.group_id,
        data.is_activated,
    ];

    return queryHelper(command, queryData, (result) => true);
};

const getStudentData = (userId) => {
    const command = 'SELECT is_activated, group_id FROM student where user_id = ?';

    return queryHelper(command, userId, (result) => result[0]);
};

const getUserInfo = (userId) => {
    const command = 'SELECT user.id, user.first_name, user.last_name, user.father_name, user.phone, user.email, user.account_type as account_type_id, account_type.name as account_type_name FROM user, account_type WHERE user.id = ? AND user.account_type = account_type.id';

    return queryHelper(command, userId, (result) => (result.length === 0) ? null : result[0]);
};

const getTeacherData = (userId) => {
    const command = 'SELECT group_id FROM teacher WHERE user_id = ?';

    return queryHelper(command, userId, (result) => (result.length === 0) ? null : result[0]);
};

module.exports = {
    addUser,
    getStudentData,
    getUserInfo,
    checkIfEmailUsed,
    checkIfUserExists,
    getUserByEmail,
    getAccountTypeByUserId,
    isStudentAccountActivated,
    setStudentActivation,
    addStudentData,
    getTeacherData,
}
