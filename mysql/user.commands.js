const QueryHelper = require('../helpers/QueryHelper');

const checkIfEmailUsed = (email) => {
    return QueryHelper.query('SELECT EXISTS (SELECT 1 FROM user WHERE email = ?)')
        .withParams(email)
        .then((result) => Object.values(result[0])[0] === 1)
        .commit();
};

const checkIfUserExists = (userId) => {
    return QueryHelper.query('SELECT EXISTS (SELECT 1 FROM user WHERE id = ?)')
        .withParams(userId)
        .then((result) => Object.values(result[0])[0] === 1)
        .commit();
};

const addUser = (user) => {
    return QueryHelper.query('INSERT INTO user (account_type, last_name, first_name, father_name, phone, email, password) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .withParams([
            user.account_type,
            user.last_name,
            user.first_name,
            user.father_name,
            user.phone,
            user.email,
            user.password
        ]).then((result) => result.insertId).commit();
}

const getAccountTypeByUserId = (userId) => {
    return QueryHelper.query('SELECT account_type FROM user WHERE id = ? ')
        .withParams(userId)
        .then((result) => Number(result[0].account_type))
        .commit();
};

const getUserByEmail = (email) => {
    return QueryHelper.query('SELECT * FROM user WHERE email = ?')
        .withParams(email)
        .then((result) => result[0])
        .commit();
};

const isStudentAccountActivated = (userId) => {
    return QueryHelper.query('SELECT EXISTS (SELECT 1 FROM student WHERE user_id = ? AND is_activated = 1)')
        .withParams(userId)
        .then((result) => (!result.length) ? false : Object.values(result[0])[0] === 1)
        .commit();
};

const setStudentActivation = (userId, value) => {
    return QueryHelper.query('UPDATE student SET is_activated = ? WHERE user_id = ?')
        .withParams(value, userId)
        .then((result) => true)
        .commit();
};

const addStudentData = (data) => {
    return QueryHelper.query('INSERT INTO student (user_id, group_id, is_activated) VALUES (?, ?, ?)')
        .withParams([
            data.user_id,
            data.group_id,
            data.is_activated,
        ]).commit();
};

const getStudentData = (userId) => {
    return QueryHelper.query('SELECT is_activated, group_id FROM student where user_id = ?')
        .withParams(userId)
        .then((result) => result[0])
        .commit();
};

const getUserInfo = (userId) => {
    return QueryHelper.query('SELECT user.id, user.first_name, user.last_name, user.father_name, user.phone, user.email, user.account_type as account_type_id, account_type.name as account_type_name FROM user, account_type WHERE user.id = ? AND user.account_type = account_type.id')
        .withParams(userId)
        .then((result) => result[0])
        .commit();
};

const getTeacherData = (userId) => {
    return QueryHelper.query('SELECT group_id FROM teacher WHERE user_id = ?')
        .withParams(userId)
        .then((result) => (!result.length) ? null : result[0])
        .commit();
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
