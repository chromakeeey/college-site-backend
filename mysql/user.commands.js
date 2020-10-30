const mysql = require("mysql2")
const { connection } = require('./connection')

const addUser = (user, callback) => {
    const command = `INSERT INTO user (account_type_id, last_name, first_name, fathername, phone, email, group_id, password) VALUES (
        ${user.accountType}, 
        '${user.surname}', 
        '${user.name}', 
        '${user.fathername}', 
        '${user.phone}', 
        '${user.email}', 
        ${user.groupid}, 
        '${user.password}'
    )`

    connection.query(command, (err, result) => {
        if (err) {
            console.log(err)
            callback({message: err.message})
        } 

        callback({userid: result.insertId})
    } )
}

const getUser = (userId, callback) => {
    const command = `SELECT * FROM user WHERE id = ${userId}`

    connection.query(command, (err, result) => {
        if (err) {
            console.log(err)
            callback({message: err.message})
        } else {
            if (result.length === 0) {
                callback({message: 'User not found'})
            } else {
                callback(result[0])
            }
        }
    })
}

const getUserSubjects = (userId, callback) => {
    const command = `SELECT * FROM subject_teachers WHERE user_id = ${userId}`

    connection.query(command, (err, result) => {
        if (err) {
            console.log(err)
            callback({message: err.message})
        } else {
            callback({
                subjects: result
            })
        }
    })
}

const addUserSubject = (userId, subjectId, callback) => {
    const command = `INSERT INTO subject_teachers (user_id, subject_id) VALUES (${userId}, ${subjectId})`

    connection.query(command, (err, result) => {
        if (err) {
            console.log(err)
            callback({message: err.message})
        } else {
            callback({
                subject_teachers_id: result.insertId
            })
        }
    })
}

module.exports = {
    addUser,
    getUser,
    getUserSubjects,
    addUserSubject
}