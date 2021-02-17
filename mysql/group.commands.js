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
            user.id, user.first_name,
            user.last_name,
            user.father_name,
            user.phone,
            user.is_activated,
            curator_group.id AS group_id,
            curator_group.specialty_id,
            curator_group.course,
            curator_group.subgroup,
            specialty.name
        FROM
            teacher
        INNER JOIN 
            user,
            specialty,
            \`group\` AS curator_group
        WHERE 
            teacher.user_id = user.id
        AND
            teacher.group_id = ?
        AND
            curator_group.id = teacher.group_id
    `;
    const [rows] = await connectionPool.query(sql, groupId);

    return rows[0];
};

const getGroupMembers = async (groupId) => {
    const sql = `
        SELECT
            user.account_type,
            user.id,
            user.first_name,
            user.last_name,
            user.father_name,
            user.phone,
            user.is_activated
        FROM 
            user
        JOIN
            student
        ON
            student.user_id = user.id AND student.group_id = ?
    `;
    const [rows] = await connectionPool.query(sql, groupId);

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

const isGroupMember = async ({
    groupId, userId
}) => {
    const sql = 'SELECT EXISTS (SELECT 1 FROM student WHERE group_id = ? AND user_id = ?)';
    const [rows] = await connectionPool.query(sql, [groupId, userId]);

    return Object.values(rows[0])[0] === 1;
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
    isGroupMember,
};
