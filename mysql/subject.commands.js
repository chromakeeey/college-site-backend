const { connection } = require('../mysql/connection')

const selectAllSubjects = (callback) => {
    connection.query('SELECT * FROM subject', (err, result) => {
        if (err) {
            console.log(err)
            callback({message: err.message})
        } 

        callback({subjects: result})
    } )
}

const addSubject = (subject, callback) => {
    const command = `INSERT INTO subject (name) VALUES ('${subject.name}')`
    connection.query(command, (err, result) => {
        if (err) {
            console.log(err)
            callback({message: err.message})
        } 

        callback({subjectid: result.insertId})
    } )
}

const getSubject = (subjectId, callback) => {
    const command = `SELECT * FROM subject WHERE id = ${subjectId}`
    connection.query(command, (err, result) => {
        if (err) {
            console.log(err)
            callback({message: err.message})
        } 

        if (result.length === 0) {
            callback({message: 'Subject not found'})
        } else {
            callback(result[0])
        }
    } )
}

module.exports = {
    selectAllSubjects,
    addSubject,
    getSubject
}