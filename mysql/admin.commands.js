const { connectionPool } = require("./connection");

const addAdmin = async ({
    firstName,
    lastName,
    fatherName,
    email,
    phone,
    accountType,
    isActivated,
    password
}) => {
    const sql = `
        INSERT INTO
            \`user\` (first_name, last_name, father_name, email, phone, account_type, is_activated, password)
        VALUES
            (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [rows] = await connectionPool.query(sql, [
        firstName,
        lastName,
        fatherName,
        email,
        phone,
        accountType,
        isActivated,
        password
    ]);

    return rows.insertId;
};

module.exports = {
    addAdmin
};