const { connectionPool } = require("./connection");

const getGroups = async () => {
    const [rows] = await connectionPool.query('SELECT * FROM `group`');

    return rows;
};

const getGroup = async (groupId) => {
    const [rows] = await connectionPool.query('SELECT * FROM `group` WHERE id = ?', groupId);

    return rows[0];
};

const addGroup = async ({
    specialtyId, course, subgroup
}) => {
    const [rows] = await connectionPool.query('INSERT INTO `group` (specialty_id, course, subgroup) VALUES (?, ?, ?)', [
        specialtyId,
        course,
        subgroup
    ]);

    return rows.insertId;
};

const removeGroup = async (groupId) => {
    await connectionPool.query('DELETE FROM `group` WHERE id = ?', groupId);
};

const setGroupCourse = async (groupId, course) => {
    const [rows] = await connectionPool.query('UPDATE `group` SET course = ? WHERE id = ?', [
        course,
        groupId
    ]);

    return rows.affectedRows > 0;
};

const setGroupSpecialty = async (groupId, specialtyId) => {
    const [rows] = await connectionPool.query('UPDATE `group` SET specialty_id = ? WHERE id = ?', [
        specialtyId,
        groupId
    ]);

    return rows.affectedRows > 0;
};

const setGroupSubgroup = async (groupId, subgroup) => {
    const [rows] = await ConvolverNode.query('UPDATE `group` SET subgroup = ? WHERE id = ?', [
        subgroup,
        groupId
    ]);

    return rows.affectedRows > 0;
};

module.exports = {
    getGroups,
    getGroup,
    addGroup,
    removeGroup,
    setGroupCourse,
    setGroupSpecialty,
    setGroupSubgroup,
}
