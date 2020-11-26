const { Router } = require("express");
const { body, param } = require("express-validator");

const router = Router();
const AppError = require('../helpers/AppError');
const middlewares = require('./middlewares');

const {
    getGroups,
    getGroup,
    addGroup,
    removeGroup,
    setGroupCourse,
    setGroupSpecialty,
    setGroupSubgroup,
} = require("../mysql/group.commands");

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
    body('specialty_id')
        .exists().withMessage('This parameter is required.')
        .isInt().toInt().withMessage('The value should be of type integer.'),
    body('course')
        .exists().withMessage('This parameter is required.')
        .isInt().toInt().withMessage('The value should be of type integer.'),
    body('subgroup')
        .exists().withMessage('This parameter is required.')
        .isInt().toInt().withMessage('The value should be of type integer')
], [
    middlewares.validateData,
    middlewares.loginRequired,
    middlewares.adminPrivilegeRequired
], async (req, res) => {
    const id = await addGroup(req.body);

    res.status(201).json({ id: id });
});

router.delete('/groups/:id', [
    param('id')
        .exists().withMessage('This parameter is required.')
        .isInt().toInt().withMessage('The value should be of type integer.'),
], [
    middlewares.validateData,
    middlewares.loginRequired,
    middlewares.adminPrivilegeRequired,
], async (req, res) => {
    await removeGroup(req.params.id);

    res.status(200).end();
});

router.get('/groups/:id', [
    param('id')
        .exists().withMessage('This parameter is required.')
        .isInt().toInt().withMessage('The value should be of type integer.'),
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
    param('id')
        .exists().withMessage('This parameter is required.')
        .isInt().toInt().withMessage('The value should be of type integer.'),
    body('course')
        .exists().withMessage('This parameter is required.')
        .isInt().toInt().withMessage('The value should be of type integer.'),
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
    param('id')
        .exists().withMessage('This parameter is required.')
        .isInt().toInt().withMessage('The value should be of type integer.'),
    body('specialty_id')
        .exists().withMessage('This parameter is required.')
        .isInt().toInt().withMessage('The value should be of type integer.'),
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
    param('id')
        .exists().withMessage('This parameter is required.')
        .isInt().toInt().withMessage('The value should be of type integer.'),
    body('subgroup')
        .exists().withMessage('This parameter is required.')
        .isInt().toInt().withMessage('The value should be of type integer.'),
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
