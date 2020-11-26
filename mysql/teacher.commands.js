const { connectionPool } = require('./connection');

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

module.exports = {
    getTeacherData,
}
