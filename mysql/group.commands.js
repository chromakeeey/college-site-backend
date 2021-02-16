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

const setCurator = async ({
        groupId, userId
    }) => {
    const [rows] = await connectionPool.query('INSERT INTO teacher VALUES (?, ?)', [
        userId,
        groupId
    ]);

    return rows.affectedRows > 0;
};

const updateCurator = async ({
        groupId, userId
    }) => {
    const [rows] = await connectionPool.query('UPDATE teacher SET group_id = ? WHERE user_id = ?', [
        groupId,
        userId
    ]);

    return rows.affectedRows > 0;
};

const isCurator = async (userId, groupId) => {
    const sql = 'SELECT EXISTS (SELECT 1 FROM teacher WHERE group_id = ? AND user_id = ?)';
    const [rows] = await connectionPool.query(sql, [groupId, userId]);

    return Object.values(rows[0])[0] === 1;
};

const isStudentInGroup = async (userId, groupId) => {
    const sql = 'SELECT EXISTS (SELECT 1 FROM student WHERE group_id = ? AND user_id = ?)';
    const [rows] = await connectionPool.query(sql, [groupId, userId]);

    return Object.values(rows[0])[0] === 1;
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

const getGroupSubjectsList = async (groupId) => {
    const sql = `
        SELECT
            subject.*
        FROM
            subject, subject_group
        WHERE
            (subject.id = subject_group.subject_id)
        AND
            (subject_group.group_id = ?)
    `;
    const [groupSubjects] = await connectionPool.query(sql, groupId);

    return groupSubjects;
}

const getGroupSubjects = async (groupId) => {
    let [rows] = await connectionPool.query('SELECT * FROM subject_group WHERE group_id = ?', groupId);

    await Promise.all(rows.map(async (row) => {
        const [subject] = await connectionPool.query('SELECT * FROM subject WHERE id = ?', row.subject_id);
        const [user] = await connectionPool.query('SELECT id, first_name, last_name, father_name FROM user WHERE id = ?', row.user_id);

        delete row.user_id;
        delete row.subject_id;

        row.user = user[0];
        row.subject = subject[0];
    }));

    return rows;
}

const addGroupSubject = async (groupSubject) => {
    const sql = `
        INSERT INTO
            subject_group (group_id, subgroup_id, subject_id, user_id)
        VALUES
            (?, ?, ?, ?)
    `;

    const [rows] = await connectionPool.query(sql, [
        groupSubject.group_id,
        groupSubject.subgroup_id,
        groupSubject.subject_id,
        groupSubject.user_id
    ])

    return rows.insertId;
};

const changeProgram = async (id, programEducationId) => {
    const sql = `
        UPDATE
            subject_group
        SET
            program_education_id = ?
        WHERE
            id = ?
    `;

    const [rows] = await connectionPool.query(sql, [
        programEducationId,
        id,
    ]);

    return rows.affectedRows > 0;
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
    updateCurator,
    isExists,
    isCurator,
    isStudentInGroup,
    getGroupSubjectsList,
    getGroupSubjects,
    addGroupSubject,
    changeProgram,
};
