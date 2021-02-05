const { Router } = require("express");
const { body, param } = require("express-validator");

const router = Router();
const AppError = require('../helpers/AppError');
const middlewares = require('./middlewares');

const Group = require('../mysql/group.commands');

router.get('/groups', async (req, res) => {
    const groups = await Group.getGroups();

    if (!groups.length) {
        return res.status(204).end();
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

router.put('/groups/:id/curator', [
    param('id')
        .exists().withMessage('This parameter is required.')
        .isInt().toInt().withMessage('The value should be of type integer.'),
    body('group_id')
        .exists().withMessage('This parameter is required.')
        .isInt().toInt().withMessage('The value should be of type integer.'),
    body('curator_id')
        .exists().withMessage('This parameter is required.')
        .isInt().toInt().withMessage('The value should be of type integer.'),
], [
    middlewares.validateData,
    middlewares.loginRequired,
    middlewares.adminPrivilegeRequired,
], async (req, res) => {
    if (req.session.userId !== req.params.id) {
        throw new AppError('Access forbidden.', 403);
    }
    
    const success = await Group.setCurator(req.body);

    if(!success) {
        throw new AppError('Group with this id was not found.', 404);
    }

    res.status(201).end();
});

router.get('/groups/:id/curator', [
    body('group_id')
        .exists().withMessage('This parameter is required.')
        .isInt().toInt().withMessage('The value should be of type integer.'),
], [
    middlewares.validateData,
    middlewares.loginRequired
], async (req, res) => {
    const curator = await Group.getCurator(req.body.group_id);
   
    if (curator == null) {
        return res.status(204).end();
    }

    curator.is_activated = Boolean(curator.is_activated);

    curator.group = {
        group_id : curator.group_id,
        specialty_id : curator.specialty_id,
        course : curator.course,
        subgroup : curator.subgroup,
        name : curator.name,
        group_name : `${curator.specialty_id}${curator.course}${curator.subgroup}`
    };

    delete curator.group_id;
    delete curator.specialty_id;
    delete curator.course;
    delete curator.subgroup;
    delete curator.name;

    res.status(200).json(curator);
});

router.get('/groups/:id/members', [
    param('id')
        .exists().withMessage('This parameter is required.')
        .isInt().toInt().withMessage('The value should be of type integer.'),
], [
    middlewares.validateData,
    middlewares.loginRequired
], async (req, res) => {
    const members = await Group.getGroupMembers(req.params.id);
   
    if (members.length <= 0) {
        return res.status(204).end();
    }

    members.forEach(member =>{
        member.is_activated = Boolean(member.is_activated);
        member.is_curator = member.account_type === 2;

        delete member.account_type;
    });

    res.status(200).json(members);
});

module.exports = router
