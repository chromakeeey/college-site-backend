const mysql = require("mysql2")
const { connection } = require('../mysql/connection')

const insertUser = (user) => {
    let userId = undefined;

    const command = `INSERT INTO Users () VALUES ()`
}

module.exports = {
    insertUser
}