const { Router } = require("express");
const { body, param, query } = require("express-validator");
const router = Router();

const AppError = require('../helpers/AppError');
const middlewares = require('./middlewares');
const AccountType = require('../helpers/AccountType');
const HashHelper = require("../helpers/HashHelper");

const {
    checkIfEmailUsed,
    getAccountTypeByUserId,
    addUser,
} = require('../mysql/user.commands');

const {
    getStudents,
    getStudentsCount,
    addStudentData,
    setStudentActivation,
} = require('../mysql/student.commands');

router.put('/students/:id/activated', [
    param('id')
        .exists().withMessage('This parameter is required.')
        .isInt().toInt().withMessage('The value should be of type integer.'),
    body('is_activated')
        .exists().withMessage('This parameter is required.')
        .isBoolean().toBoolean().withMessage('The value should be of type boolean.'),
], [
    middlewares.validateData,
    middlewares.loginRequired,
    middlewares.adminPrivilegeRequired,
], async (req, res) => {
    const { is_activated } = req.body;

    await setStudentActivation(req.params.id, is_activated);

    res.status(201).end();
});

router.get('/students', [
    query('order')
        .optional()
        .custom((value) => [
            'asc',
            'desc'
        ].includes(value)).withMessage('The only acceptable values are \'asc\' & \'desc\'.'),
    query('order_by')
        .optional()
        .custom((value) => [
            'first_name',
            'last_name',
            'father_name',
            'phone',
            'email'
        ].includes(value)).withMessage('The only acceptable values are \'first_name\', \'last_name\', \'father_name\', \'phone\', \'email\'.'),
    query('count')
        .exists().withMessage('This parameter is requried.')
        .custom((value) => value > 0).withMessage('Count should be greater than 0.')
        .isInt().toInt().withMessage('The value should be of type integer.'),
    query('page')
        .isInt().toInt().withMessage('Page number should be of type integer.')
        .custom((value) => value > 0).withMessage('Page number should be greater than 0.')
        .optional(),
    query('is_activated')
        .isBoolean().toBoolean().withMessage('The value should be of type boolean.')
        .optional(),
    query('group_id')
        .isInt().toInt().withMessage('The value should be of type integer.')
        .optional()
], [
    middlewares.validateData,
    middlewares.loginRequired
], async (req, res) => {
    const queries = req.query;
    const accountType = await getAccountTypeByUserId(req.session.user_id);
    const offset = (queries.page) ? (queries.count * queries.page) - queries.count : 0;

    const students = await getStudents({
        ascendingOrder: queries.order,
        orderBy: queries.order_by,
        offset: offset,
        limit: queries.count,
        groupId: queries.group_id,
        isActivated: queries.is_activated
    });

    if (!students.length) {
        return res.status((queries.page) ? 404 : 204).end();
    }

    students.forEach((student) => {
        if (accountType === AccountType.STUDENT && req.session.user_id !== student.id) {
            delete student.email;
            delete student.phone;
        }

        student.group = {
            'group_id': student.group_id,
            'group_name': ''.concat(student.specialty_id, student.course, student.subgroup),
            'specialty_id': student.specialty_id,
            'specialty_name': student.specialty_name,
            'course': student.course,
            'subgroup': student.subgroup
        };

        delete student.group_id;
        delete student.course;
        delete student.subgroup;
        delete student.specialty_id;
        delete student.specialty_name;
    });

    const studentsCount = await getStudentsCount({
        isActivated: queries.is_activated,
        groupId: queries.group_id
    });
    const pageCount = Math.ceil(studentsCount / queries.count);

    res.status(200).json({
        'page_count': pageCount,
        'current_item_count': students.length,
        'result': students
    });
});

router.post('/students', [
    body('first_name')
        .exists().withMessage('This parameter is required.')
        .isLength({
            min: 2,
            max: 128
        }).withMessage('The value should be in a range from 2 to 128 characters long.'),
    body('last_name')
        .exists().withMessage('This parameter is required.')
        .isLength({
            min: 2,
            max: 128
        }).withMessage('The value should be in a range from 2 to 128 characters long.'),
    body('father_name')
        .exists().withMessage('This parameter is required.')
        .isLength({
            min: 2,
            max: 128
        }).withMessage('The value should be in a range from 2 to 128 characters long.'),
    body('email')
        .exists().withMessage('This parameter is required.')
        .isEmail().withMessage('The value should be a valid email address.'),
    body('phone')
        .exists().withMessage('This parameter is required.')
        .isMobilePhone().withMessage('The value should be a valid phone number.'),
    body('password')
        .exists().withMessage('This parameter is required.')
        .isLength({
            min: 8,
        }).withMessage('The value should be at least 8 characters long.'),
    body('group_id')
        .exists().withMessage('This parameter is required.')
        .isInt().toInt().withMessage('The value should be of type integer.'),
], middlewares.validateData, async (req, res) => {
    const data = req.body;
    const emailUsed = await checkIfEmailUsed(data.email);

    if (emailUsed) {
        throw new AppError('The email address is in use.', 409);
    }

    const hash = await HashHelper.hash(data.password);
    data.password = hash;
    data.account_type = AccountType.STUDENT;

    const userId = await addUser(data);
    await addStudentData({
        user_id: userId,
        group_id: data.group_id,
        is_activated: false
    })

    res.status(202).end();
});

module.exports = router
