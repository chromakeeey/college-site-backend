const { Router } = require("express");
const { body, param } = require("express-validator");
const router = Router();

const AppError = require('../helpers/AppError');
const {
    getGroups,
    getGroup,
    addGroup,
    removeGroup,
    setGroupCourse,
    setGroupSpecialty,
    setGroupSubgroup,
} = require("../mysql/group.commands");
const middlewares = require('./middlewares');

router.get('/groups', async (req, res) => {
    const groups = await getGroups();

    if (!groups.length) {
        res.status(204).end();
    }

    groups.forEach(group => {
        group.group_name = ''.concat(group.specialty_id, group.course, group.subgroup);
    });

    res.status(200).json(groups);
});

router.post('/groups', [
    body('specialty_id').isInt(),
    body('course').isInt(),
    body('subgroup').isInt()
], [
    middlewares.validateData,
    middlewares.loginRequired,
    middlewares.adminPrivilegeRequired
], async (req, res) => {
    const id = await addGroup(req.body);

    res.status(201).json({ id: id });
});

router.delete('/groups/:id', [
    param('id').isInt().toInt(),
], [
    middlewares.validateData,
    middlewares.loginRequired,
    middlewares.adminPrivilegeRequired,
], async (req, res) => {
    await removeGroup(req.params.id);

    res.status(200).end();
});

router.get('/groups/:id', [
    param('id').isInt().toInt(),
], [
    middlewares.validateData,
], async (req, res) => {
    const group = await getGroup(req.params.id);

    if (!group) {
        throw new AppError('Group with this id was not found.', 404);
    }

    group.group_name = ''.concat(group.specialty_id, group.course, group.subgroup);

    res.status(200).json(group);
});

router.put('/groups/:id/course', [
    param('id').isInt().toInt(),
    body('course').isInt().toInt(),
], [
    middlewares.validateData,
    middlewares.loginRequired,
    middlewares.adminPrivilegeRequired,
], async (req, res) => {
    const id = req.params.id;
    const { course } = req.body;

    const success = await setGroupCourse(id, course);

    if (!success) {
        throw new AppError('Group with this id was not found.', 404);
    }

    res.status(201).end();
});

router.put('/groups/:id/specialty', [
    param('id').isInt().toInt(),
    body('specialty_id').isInt().toInt(),
], [
    middlewares.validateData,
    middlewares.loginRequired,
    middlewares.adminPrivilegeRequired,
], async (req, res) => {
    const id = req.params.id;
    const { specialty_id } = req.body;

    const success = await setGroupSpecialty(id, specialty_id);

    if (!success) {
        throw new AppError('Group with this id was not found.', 404);
    }

    res.status(201).end();
});

router.put('/groups/:id/subgroup', [
    param('id').isInt().toInt(),
    body('subgroup').isInt().toInt(),
], [
    middlewares.validateData,
    middlewares.loginRequired,
    middlewares.adminPrivilegeRequired,
], async (req, res) => {
    const id = req.params.id;
    const { subgroup } = req.body;

    const success = await setGroupSubgroup(id, subgroup);

    if (!success) {
        throw new AppError('Group with this id was not found.', 404);
    }

    res.status(201).end();
});

module.exports = router
