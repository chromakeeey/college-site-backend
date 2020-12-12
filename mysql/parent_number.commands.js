const { connectionPool } = require('./connection');

const addParentNumber = async ({
    userId,
    firstName,
    lastName,
    role,
    phone
}) => {
    const sql = `
        INSERT INTO
            student_parent_number (user_id, first_name, last_name, role, phone)
        VALUES
            (?, ?, ?, ?, ?)
    `;
    await connectionPool.query(sql, [
        userId,
        firstName,
        lastName,
        role,
        phone
    ]);
};

module.exports = {
    addParentNumber,
};
