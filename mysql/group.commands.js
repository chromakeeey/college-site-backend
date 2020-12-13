const { connectionPool } = require("./connection");

const getGroups = async () => {
    const [rows] = await connectionPool.query('SELECT * FROM `group`');

    return rows;
};

const getGroup = async (groupId) => {
    const [rows] = await connectionPool.query('SELECT * FROM `group` WHERE id = ?', groupId);

    return rows[0];
};

const addGroup = async (group) => {
    const [rows] = await connectionPool.query('INSERT INTO `group` (specialty_id, course, subgroup) VALUES (?, ?, ?)', [
        group.specialty_id,
        group.course,
        group.subgroup
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

const setCurator = async (curator) => {
    const [rows] = await connectionPool.query('UPDATE `teacher` SET group_id = ? WHERE user_id = ?', [
        curator.group_id,
        curator.curator_id
    ]);

    return rows.affectedRows > 0;
};

const getGroupCurator = async (groupId) => {
    const [rows] = await connectionPool.query('SELECT u.id, u.first_name, u.last_name, u.father_name, u.phone, u.is_activated FROM `teacher` AS t INNER JOIN `user` AS u WHERE t.user_id = u.id AND t.group_id = ?', groupId);

    return rows[0];
};

const getGroupInfo = async (groupId) => {
    const [rows] = await connectionPool.query('SELECT g.id, g.specialty_id, g.course, g.subgroup, s.name FROM `specialty` AS s INNER JOIN `group` AS g WHERE g.id = 2', groupId);

    rows[0].group_name = `${rows[0].specialty_id}${rows[0].course}${rows[0].subgroup}`;

    return rows[0];
};

module.exports = {
    getGroups,
    getGroup,
    getGroupCurator,
    getGroupInfo,
    addGroup,
    removeGroup,
    setGroupCourse,
    setGroupSpecialty,
    setGroupSubgroup,
    setCurator
}
