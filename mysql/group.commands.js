const QueryHelper = require('../helpers/QueryHelper');

const getGroups = () => {
    return QueryHelper.query('SELECT * FROM `group`').commit();
};

const getGroup = (groupId) => {
    return QueryHelper.query('SELECT * FROM `group` WHERE id = ?')
        .withParams(groupId)
        .then((result) => result[0])
        .commit();
};

const addGroup = (group) => {
    return QueryHelper.query('INSERT INTO `group` (specialty_id, course, subgroup) VALUES (?, ?, ?)')
        .withParams(group.specialty_id, group.course, group.subgroup)
        .then((result) => result.insertId)
        .commit();
};

const removeGroup = (groupId) => {
    return QueryHelper.query('DELETE FROM `group` WHERE id = ?')
        .withParams(groupId)
        .commit();
};

const setGroupCourse = (groupId, course) => {
    return QueryHelper.query('UPDATE `group` SET course = ? WHERE id = ?')
        .withParams(course, groupId)
        .then((result) => result.affectedRows > 0)
        .commit();
};

const setGroupSpecialty = (groupId, specialtyId) => {
    return QueryHelper.query('UPDATE `group` SET specialty_id = ? WHERE id = ?')
        .withParams(specialtyId, groupId)
        .then((result) => result.affectedRows > 0)
        .commit();
};

const setGroupSubgroup = (groupId, subgroup) => {
    return QueryHelper.query('UPDATE `group` SET subgroup = ? WHERE id = ?')
        .withParams(subgroup, groupId)
        .then((result) => result.affectedRows > 0)
        .commit();
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
