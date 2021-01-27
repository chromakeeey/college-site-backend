const connectionPool = require('./connection');

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

const setParentFirstName = async(parentId, newFirstName) => {
    const sql = 'UPDATE `student_parent_number` SET first_name = ? WHERE id = ?';

    const [rows] = await connectionPool.query(sql, [
        newFirstName,
        parentId
    ]);

    return rows.affectedRows > 0;
};

const setParentLastName = async(parentId, newLastName) => {
    const sql = 'UPDATE `student_parent_number` SET last_name = ? WHERE id = ?';

    const [rows] = await connectionPool.query(sql, [
        newLastName,
        parentId
    ]);

    return rows.affectedRows > 0;
};

const setParentPhoneNumber = async (parentId, newPhoneNumber) => {
    const sql = 'UPDATE `student_parent_number` SET phone = ? WHERE id = ?';

    const [rows] = await connectionPool.query(sql, [
        newPhoneNumber,
        parentId
    ]);

    return rows.affectedRows > 0;
};

const setParentRole = async (parentId, newParentRole) => {
    const sql = 'UPDATE `student_parent_number` SET role = ? WHERE id = ?';

    const [rows] = await connectionPool.query(sql, [
        newParentRole,
        parentId
    ]);

    return rows.affectedRows > 0;
};

const checkIfBelongsToStudent = async (parentId, userId) => {
    const sql = 'SELECT EXISTS (SELECT 1 FROM student_parent_number WHERE id = ? AND user_id = ?)';
    const [rows] = await connectionPool.query(sql, [
        parentId,
        userId
    ]);

    return Object.values(rows[0])[0] === 1;
};

const deleteParent = async (parentId) => {
    const sql = 'DELETE FROM `student_parent_number` WHERE id = ?';

    const [rows] = await connectionPool.query(sql, parentId);

    return rows.affectedRows > 0;
};

const getParents = async(userId) => {
    const sql = 'SELECT * FROM `student_parent_number` WHERE user_id = ?';

    const [rows] = await connectionPool.query(sql, userId);

    return rows;
};

module.exports = {
    addParentNumber,
    setParentFirstName,
    setParentLastName,
    setParentPhoneNumber,
    setParentRole,
    deleteParent,
    getParents,
    checkIfBelongsToStudent,
};
