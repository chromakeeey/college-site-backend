const connectionPool = require('./connection');

const getGroups = async () => {
    const [rows] = await connectionPool.query('SELECT * FROM `group`');

    return rows;
};

const getGroup = async (groupId) => {
    const [rows] = await connectionPool.query('SELECT * FROM `group` WHERE id = ?', groupId);

    return rows[0];
};

const isExists = async (groupId) => {
    const [rows] = await connectionPool.query('SELECT EXISTS (SELECT 1 FROM `group` WHERE id = ?)', groupId);

    return Object.values(rows[0])[0] === 1;
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

const setCurator = async (curator) => {
    const [rows] = await connectionPool.query('UPDATE `teacher` SET group_id = ? WHERE user_id = ?', [
        curator.group_id,
        curator.curator_id
    ]);

    return rows.affectedRows > 0;
};

const getCurator = async (groupId) => {
    const sql = `
        SELECT
            u.id,
            u.first_name,
            u.last_name,
            u.father_name,
            u.phone,
            u.is_activated,
            g.id AS group_id,
            g.specialty_id,
            g.course,
            g.subgroup,
            s.name
        FROM
            \`teacher\` AS t
        INNER JOIN 
            \`user\` AS u,
            \`specialty\` AS s,
            \`group\` AS g
        WHERE 
            t.user_id = u.id
        AND
            t.group_id = ?
        AND
            g.id = t.group_id
    `;
    const [rows] = await connectionPool.query(sql, groupId);

    return rows[0];
};

const getGroupMembers = async(groupId) => {
    const sql = `
        SELECT DISTINCT
            u.account_type,
            u.id,
            u.first_name,
            u.last_name,
            u.father_name,
            u.is_activated
        FROM 
            \`student\` AS s,
            \`teacher\` AS t, 
            \`user\` AS u
        WHERE
            (s.group_id = ? AND s.user_id = u.id)
        OR
            (t.group_id = ? AND t.user_id = u.id)
    `;
    const [rows] = await connectionPool.query(sql, [
        groupId,
        groupId
    ]);

    return rows;
};

module.exports = {
    getGroups,
    getGroupMembers,
    getGroup,
    getCurator,
    addGroup,
    removeGroup,
    setGroupCourse,
    setGroupSpecialty,
    setGroupSubgroup,
    setCurator,
    isExists
};
