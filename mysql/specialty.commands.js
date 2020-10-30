const { connection } = require('../mysql/connection')

const getAllSpecialty = (callback) => {
    connection.query('SELECT * FROM specialty', (err, result) => {
        if (err) {
            console.log(err)
            callback({message: err.message})
        } 

        callback({specialty: result})
    } )
}

const addSpecialty = (specialty, callback) => {
    const command = `INSERT INTO specialty (id, name) VALUES (${specialty.id}, '${specialty.name}')`
    connection.query(command, (err, result) => {
        if (err) {
            console.log(err)
            callback({message: err.message})
        } 

        callback({specialty_id: specialty.id})
    } )
}

const getSpecialty = (specialtyId, callback) => {
    const command = `SELECT * FROM specialty WHERE id = ${specialtyId}`
    connection.query(command, (err, result) => {
        if (err) {
            console.log(err)
            callback({message: err.message})
        } 

        if (result.length === 0) {
            callback({message: 'Specialty not found'})
        } else {
            callback(result[0])
        }
    } )
}

module.exports = {
    getAllSpecialty,
    addSpecialty,
    getSpecialty
}