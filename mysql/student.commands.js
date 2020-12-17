const { connectionPool } = require('./connection');
const AccountType = require('../helpers/AccountType');

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
            conditions.push('user.is_activated = ?');
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
            conditions.push('user.is_activated = ?');
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
            student.group_id, user.is_activated,
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

const getStudentData = async (userId) => {
    const sql = `
        SELECT
            student.group_id,
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

const addStudentData = async ({
    user_id,
    group_id
}) => {
    await connectionPool.query('INSERT INTO student (user_id, group_id) VALUES (?, ?)', [
        user_id,
        group_id
    ]);
};

const setStudentGroup = async (userId, groupId) => {
    const sql = 'UPDATE `student` SET group_id = ? WHERE user_id = ?';

    const [rows] = await connectionPool.query(sql, [
        groupId,
        userId
    ]);

    return rows.affectedRows > 0;
}

module.exports = {
    getStudentData,
    addStudentData,
    getStudents,
    getStudentsCount,
    setStudentGroup
}
