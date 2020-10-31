const { connectionPool } = require('./connection')

const addUser = (user, callback) => {
    const command = `INSERT INTO user (account_type_id, last_name, first_name, fathername, phone, email, group_id, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    const queryData = [
        user.accountType,
        user.surname,
        user.name,
        user.fathername,
        user.phone,
        user.email,
        user.groupid,
        user.password
    ];

    connectionPool.query(command, queryData, (err, result) => {
        if (err) {
            console.error(err);

            callback({message: err.message});
        } 

        callback({userid: result.insertId});
    });
}

const getUser = (userId, callback) => {
    const command = `SELECT * FROM user WHERE id = ?`;

    connectionPool.query(command, [userId], (err, result) => {
        if (err) {
            console.error(err);

            callback({message: err.message})
        } else {
            if (result.length === 0) {
                callback({message: 'User not found'})
            } else {
                callback(result[0])
            }
        }
    });
}

const getUserSubjects = (userId, callback) => {
    const command = `SELECT * FROM subject_teachers WHERE user_id = ?`;

    connectionPool.query(command, [userId], (err, result) => {
        if (err) {
            console.error(err);

            callback({message: err.message});
        } else {
            callback({
                subjects: result
            });
        }
    });
}

const addUserSubject = (userId, subjectId, callback) => {
    const command = `INSERT INTO subject_teachers (user_id, subject_id) VALUES (?, ?)`;
    const queryData = [
        userId,
        subjectId
    ];

    connectionPool.query(command, queryData, (err, result) => {
        if (err) {
            console.error(err);

            callback({message: err.message});
        } else {
            callback({
                subject_teachers_id: result.insertId
            });
        }
    });
}

module.exports = {
    addUser,
    getUser,
    getUserSubjects,
    addUserSubject
}