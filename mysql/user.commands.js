const { connectionPool } = require('./connection')

const checkIfUserExists = (email, callback) => {
    const command = 'SELECT EXISTS (SELECT 1 FROM user WHERE email = ?)';

    connectionPool.query(command, email, (err, result) => {
        if (err) {
            console.error(err);

            callback({message: err.message});
        } 

        const exists = Object.values(result[0])[0] === 1;

        callback(exists);
    });
};

const addUser = (user, callback) => {
    const command = `INSERT INTO user (lastname, firstname, fathername, phone, email, password) VALUES (?, ?, ?, ?, ?, ?)`;
    const queryData = [
        user.last_name,
        user.first_name,
        user.father_name,
        user.phone,
        user.email,
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

const getUserByEmail = (email, callback) => {
    const command = 'SELECT * FROM user WHERE email = ?';

    connectionPool.query(command, email, (err, result) => {
        if (err) {
            console.error(err);

            callback(null)
        } else {
            if (result.length === 0) {
                callback(null);
            } else {
                callback(result[0])
            }
        }
    });
};

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
    addUserSubject,
    checkIfUserExists,
    getUserByEmail,
}
