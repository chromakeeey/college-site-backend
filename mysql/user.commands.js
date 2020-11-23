const { connectionPool } = require('./connection');
const AccountType = require('../helpers/AccountType');

const checkIfEmailUsed = async (email) => {
    const [rows] = await connectionPool.query('SELECT EXISTS (SELECT 1 FROM user WHERE email = ?)', email)

    return Object.values(rows[0])[0] === 1;
};

const checkIfUserExists = async (userId) => {
    const [rows] = await connectionPool.query('SELECT EXISTS (SELECT 1 FROM user WHERE id = ?)', userId);

    return Object.values(rows[0])[0] === 1;
};

const addUser = async (user) => {
    const sql = `
        INSERT INTO
            user (account_type, last_name, first_name, father_name, phone, email, password)
        VALUES
            (?, ?, ?, ?, ?, ?, ?)
    `;
    const [rows] = await connectionPool.query(sql, [
        user.account_type,
        user.last_name,
        user.first_name,
        user.father_name,
        user.phone,
        user.email,
        user.password
    ]);

    return rows.insertId;
}

const getAccountTypeByUserId = async (userId) => {
    const [rows] = await connectionPool.query('SELECT account_type FROM user WHERE id = ?', userId);

    return Number(rows[0].account_type);
};

const getUserByEmail = async (email) => {
    const [rows] = await connectionPool.query('SELECT * FROM user WHERE email = ?', email);

    return rows[0];
};

const isStudentAccountActivated = async (userId) => {
    const [rows] = await connectionPool.query('SELECT EXISTS (SELECT 1 FROM student WHERE user_id = ? AND is_activated = 1)', userId);

    return (!rows.length) ? false : Object.values(rows[0])[0] === 1;
};

const setStudentActivation = async (userId, value) => {
    const [rows] = await connectionPool.query('UPDATE student SET is_activated = ? WHERE user_id = ?', [
        value,
        userId
    ]);

    return true;
};

const addStudentData = async (data) => {
    await connectionPool.query('INSERT INTO student (user_id, group_id, is_activated) VALUES (?, ?, ?)', [
        data.user_id,
        data.group_id,
        data.is_activated,
    ]);
};

const getStudentData = async (userId) => {
    const sql = `
        SELECT
            student.group_id,
            student.is_activated,
            group_data.course,
            group_data.specialty_id,
            group_data.subgroup,
            specialty.name AS specialty_name
        FROM
            student,
            \`group\` AS group_data,
            specialty
        WHERE
            student.user_id = ?
        AND
            group_data.id = student.group_id
        AND
            group_data.specialty_id = specialty.id
    `;
    const [rows] = await connectionPool.query(sql, userId);

    return rows[0];
};

const getUserInfo = async (userId) => {
    const sql = `
        SELECT
            user.id,
            user.first_name,
            user.last_name,
            user.father_name,
            user.phone,
            user.email,
            user.account_type AS account_type_id,
            account_type.name AS account_type_name
        FROM
            user, account_type
        WHERE
            user.id = ?
        AND
            user.account_type = account_type.id
    `;
    const [rows] = await connectionPool.query(sql, userId);

    return rows[0];
};

const getTeacherData = async (userId) => {
    const sql = `
        SELECT
            teacher.group_id,
            group_data.course,
            group_data.specialty_id,
            group_data.subgroup,
            specialty.name AS specialty_name
        FROM
            teacher,
            \`group\` AS group_data,
            specialty
        WHERE
            teacher.user_id = ?
        AND
            group_data.id = teacher.group_id
        AND
            group_data.specialty_id = specialty.id
    `;
    const [rows] = await connectionPool.query(sql, userId);

    return (!rows.length) ? null : rows[0];
};

const getStudentsCount = async ({
    isActivated,
    groupId
} = {}) => {
    const whereCaluse = (() => {
        const conditions = [];
        const values = [];
        const result = {
            'values': values,
            'conditions': ''
        };

        if (isActivated != undefined) {
            conditions.push('student.is_activated = ?');
            values.push(isActivated);
        }

        if (groupId != undefined) {
            conditions.push('student.group_id = ?');
            values.push(groupId);
        }

        if (conditions.length) {
            result.conditions = 'AND ' + conditions.join(' AND ');
        }

        return result;
    })();
    const sql = `
        SELECT
            COUNT(user.id)
        FROM
            user, student
        WHERE
            user.id = student.user_id
        AND
            user.account_type = ? ${whereCaluse.conditions}
    `;

    const [rows] = await connectionPool.query(sql, [
        AccountType.STUDENT,
    ].concat(whereCaluse.values));

    return Object.values(rows[0])[0];
};

const getStudents = async ({
    ascendingOrder,
    orderBy,
    isActivated,
    groupId,
    limit,
    offset
} = {}) => {
    const whereCaluse = (() => {
        const conditions = [];
        const values = [];
        const result = {
            'values': values,
            'conditions': ''
        };

        if (isActivated != undefined) {
            conditions.push('student.is_activated = ?');
            values.push(isActivated);
        }

        if (groupId != undefined) {
            conditions.push('student.group_id = ?');
            values.push(groupId);
        }

        if (conditions.length) {
            result.conditions = 'AND ' + conditions.join(' AND ');
        }

        return result;
    })();
    const limitStatement = (limit != undefined) ? `LIMIT ${limit}` : '';
    const offsetStatement = (offset != undefined) ? `OFFSET ${offset}` : '';
    const orderByClause = (() => {
        if (orderBy == undefined) {
            return '';
        }

        const ordering = (ascendingOrder === false) ? 'DESC' : 'ASC';

        return `ORDER BY user.${orderBy} ${ordering}`;
    })();

    const sql = `
        SELECT
            user.id, user.first_name,
            user.last_name, user.father_name,
            user.phone, user.email,
            student.group_id, student.is_activated,
            \`group\`.course, \`group\`.subgroup,
            specialty.id as specialty_id, specialty.name AS specialty_name
        FROM
            user
        INNER JOIN
            student
        ON
            student.user_id = user.id
        INNER JOIN
            \`group\`
        ON
            \`group\`.id = student.group_id
        INNER JOIN
            specialty
        ON
        \`group\`.specialty_id = specialty.id
        WHERE
            user.account_type = ? ${whereCaluse.conditions}
        ${ orderByClause }
        ${limitStatement}
        ${offsetStatement}
    `;

    const [rows] = await connectionPool.query(sql, [
        AccountType.STUDENT,
    ].concat(whereCaluse.values));

    return rows;
};

module.exports = {
    addUser,
    getStudentData,
    getUserInfo,
    checkIfEmailUsed,
    checkIfUserExists,
    getUserByEmail,
    getAccountTypeByUserId,
    isStudentAccountActivated,
    setStudentActivation,
    addStudentData,
    getTeacherData,
    getStudents,
    getStudentsCount,
}
