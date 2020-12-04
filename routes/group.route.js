const { Router } = require("express");
const { body, param } = require("express-validator");

const router = Router();
const AppError = require('../helpers/AppError');
const middlewares = require('./middlewares');

const Group = require('../mysql/group.commands');

router.get('/groups', async (req, res) => {
    const groups = await Group.getGroups();

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
    const data = req.body;
    const id = await Group.addGroup({
        specialtyId: data.specialty_id,
        course: data.course,
        subgroup: data.subgroup
    });

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
    await Group.removeGroup(req.params.id);

    res.status(200).end();
});

router.get('/groups/:id', [
    param('id')
        .exists().withMessage('This parameter is required.')
        .isInt().toInt().withMessage('The value should be of type integer.'),
], [
    middlewares.validateData,
], async (req, res) => {
    const group = await Group.getGroup(req.params.id);

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

    const success = await Group.setGroupCourse(id, course);

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
    const specialtyId = req.body.specialty_id;

    const success = await Group.setGroupSpecialty(id, specialtyId);

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

    const success = await Group.setGroupSubgroup(id, subgroup);

    if (!success) {
        throw new AppError('Group with this id was not found.', 404);
    }

    res.status(201).end();
});

module.exports = router
