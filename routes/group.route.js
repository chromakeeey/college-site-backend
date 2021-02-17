const { Router } = require('express');
const { body, param } = require('express-validator');

const router = Router();
const AppError = require('../helpers/AppError');
const middlewares = require('./middlewares');

const Group = require('../mysql/group.commands');
const Specialty = require('../mysql/specialty.commands');
const User = require('../mysql/user.commands');
const AccountType = require('../helpers/AccountType');

router.get('/groups', async (req, res) => {
    const groups = await Group.getGroups();

    if (!groups.length) {
        return res.status(204).end();
    }

    groups.forEach(group => {
        group.group_name = `${group.specialty_id}${group.course}${group.subgroup}`;
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
        .isInt().toInt().withMessage('The value should be of type integer'),
], [
    middlewares.validateData,
    middlewares.loginRequired,
    middlewares.adminPrivilegeRequired,
], async (req, res) => {
    const data = req.body;
    if (!await Specialty.isExists(data.specialty_id)) {
        throw new AppError('Specialty with this id was not found.', 404);
    }

    const id = await Group.addGroup({
        specialtyId: data.specialty_id,
        course: data.course,
        subgroup: data.subgroup,
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
    const groupId = req.params.id;

    if (!await Group.isExists(groupId)) {
        return res.status(404).end();
    }

    await Group.removeGroup(groupId);

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
        .isInt().toInt().withMessage('The value should be of type integer.')
        .custom((value) => {
            value = Number.parseInt(value);

            if (value == NaN) {
                return false;
            }

            return (value >= 1) && (value <= 4);
        }).withMessage('The value should be in the inclusive range from 1 to 4.'),
], [
    middlewares.validateData,
    middlewares.loginRequired,
    middlewares.adminPrivilegeRequired,
], async (req, res) => {
    const id = req.params.id;
    const { course } = req.body;

    if (!await Group.setGroupCourse(id, course)) {
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

    if (!await Specialty.isExists(specialtyId)) {
        return res.status(404).end();
    }

    if (!await Group.setGroupSpecialty(id, specialtyId)) {
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
    body('user_id')
        .exists().withMessage('This parameter is required.')
        .isInt().toInt().withMessage('The value should be of type integer.'),
], [
    middlewares.validateData,
    middlewares.loginRequired,
    middlewares.adminPrivilegeRequired,
], async (req, res) => {
    const groupId = req.params.id;
    const userId = req.body.user_id;
    const accountType = await User.getAccountTypeByUserId(userId);

    if (accountType == -1) {
        throw new AppError('Given user was not found', 404);
    }

    if (accountType && accountType != AccountType.TEACHER) {
        throw new AppError('Given user is not a teacher', 400);
    }

    const success = (await Group.getCurator(groupId)) ? await Group.updateCurator({
        groupId: groupId,
        userId: userId
    }) : await Group.setCurator({
        groupId: groupId,
        userId: userId
    })

    if(!success) {
        throw new AppError('Group with this id was not found.', 404);
    }

    res.status(201).end();
});

router.get('/groups/:id/curator', [
    middlewares.validateData,
    middlewares.loginRequired,
], async (req, res) => {
    const curator = await Group.getCurator(req.params.id);
   
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
    middlewares.loginRequired,
], async (req, res) => {
    const groupId = req.params.id;

    if (!await Group.isExists(groupId)) {
        throw new AppError('Given group was not found.', 404);
    }

    const members = await Group.getGroupMembers(groupId);
    const curator = await Group.getCurator(groupId);

    if (!members.length || !curator) {
        return res.status(204).end();
    }

    members.push(curator);

    members.forEach(member =>{
        const isCurator = member.account_type === undefined;

        member.is_activated = Boolean(member.is_activated);
        member.is_curator = isCurator;

        delete member.account_type;

        if (isCurator) {
            delete member.group_id;
            delete member.specialty_id;
            delete member.course;
            delete member.subgroup;
            delete member.name;
        }
    });

    res.status(200).json(members);
});

router.get('/groups/:id/subjects/list', [
    param('id').toInt()
], [
    middlewares.loginRequired
], async (req, res) => {
    const groupId = req.params.id;
    const groupSubjects = await Group.getGroupSubjectsList(groupId);

    res.status(200).json(groupSubjects);
})

router.get('/groups/:id/subjects', [
    param('id').toInt()
], [
   middlewares.loginRequired
], async (req, res) => {
    const groupId = req.params.id;
    const subjects = await Group.getGroupSubjects(groupId)

    res.status(200).json(subjects);
})

router.post('/groups/:id/subjects', [
    param('id').toInt(),
    body('subgroup_id').isInt().withMessage('Only integer value'),
    body('subject_id').isInt().withMessage('Only integer value'),
    body('user_id').isInt().withMessage('Only integer value')

], [
    middlewares.loginRequired
], async (req, res) => {
    const groupId = req.params.id;
    const body = req.body;
    body.group_id = groupId;

    await Group.addGroupSubject(body);

    res.status(200).end();
})

router.put('/groups/subjects/:id/program-education', [
    param('id').toInt(),
    body('program_education_id').isInt().withMessage('Only integer value')
], [
    middlewares.loginRequired
], async (req, res) => {
    const id = req.params.id;
    const program_education_id = req.body.program_education_id;

    await Group.changeProgram(id, program_education_id);

    res.status(200).end();
})

module.exports = router;
