const { Router } = require("express");
const { body, param, query } = require("express-validator");
const router = Router();

const AppError = require('../helpers/AppError');
const middlewares = require('./middlewares');

const {
    checkIfEmailUsed,
    getAccountTypeByUserId,
    isStudentAccountActivated,
    getStudentData,
    getStudents,
    getStudentsCount,
    getUserInfo,
    addStudentData,
    getTeacherData,
    getUserByEmail,
    addUser,
    setStudentActivation,
} = require('../mysql/user.commands');
const AccountType = require('../helpers/AccountType');
const HashHelper = require("../helpers/HashHelper");

router.post('/enrollees', [
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
], middlewares.validateData, async (req, res) => {
    const data = req.body;
    const emailUsed = await checkIfEmailUsed(data.email);

    if (emailUsed) {
        throw new AppError('The email address is in use.', 409);
    }

    const hash = await HashHelper.hash(data.password);
    data.password = hash;
    data.account_type = AccountType.ENROLLEE;
    
    await addUser(data);
    res.status(200).end();
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

router.post('/users/auth', [
    body('email')
        .exists().withMessage('This parameter is required.')
        .isEmail().withMessage('The value should be a valid email address.'),
    body('password')
        .exists().withMessage('This parameter is required.')
        .isLength({
            min: 8,
        }).withMessage('The value should be at least 8 characters long.'),
], middlewares.validateData, async (req, res) => {
    const data = req.body;

    // if logged in send a message
    if (req.session.user_id) {
        throw new AppError('You are already logged in.', 200);
    }

    const user = await getUserByEmail(data.email);
    if (!user) {
        throw new AppError('A user with this email was not found.', 404);
    }

    const match = await HashHelper.compare(data.password, user.password);
    if (!match) {
        throw new AppError('Password doesn not match.', 401);
    }

    switch (user.account_type) {
        case AccountType.ADMINISTRATOR:
            req.session.is_admin = true;
            
            break;
        case AccountType.STUDENT:
            const isActivated = await isStudentAccountActivated(user.id);

            if (!isActivated) {
                throw new AppError('You cannot login! Wait for an administrator to approve your registration.', 403);
            }
            break;
    }

    req.session.user_id = user.id;
    res.status(200).json({ id: user.id });
});

router.get('/users/:id', [
    param('id').isInt().toInt(),
], [
    middlewares.validateData,
    middlewares.loginRequired
], async (req, res) => {
    const id = req.params.id;
    const user = await getUserInfo(id);

    if (!user) {
        throw new AppError('User was not found.', 404);
    }

    user.account_type = {
        'id': user.account_type_id,
        'name': user.account_type_name,
    };

    delete user.account_type_id;
    delete user.account_type_name;

    let data = null;

    switch (user.account_type.id) {
        case AccountType.STUDENT:
            data = await getStudentData(id);
            user.is_activated = data.is_activated;

            break;
        case AccountType.TEACHER:
            data = await getTeacherData(id);

            user.is_curator = data !== null;

            break;
    }

    const accountType = await getAccountTypeByUserId(req.session.user_id);

    // if the current user is not the requested one or admin or teacher
    // and
    // if requested user is not admin or teacher then remove email & phone fields
    if ((accountType !== AccountType.TEACHER || accountType !== AccountType.ADMINISTRATOR)
            && req.session.user_id !== id
            && user.account_type.id !== AccountType.TEACHER
            && user.account_type.id !== AccountType.ADMINISTRATOR) {
        delete user.email;
        delete user.phone;
    }

    if (data && (accountType === AccountType.TEACHER || accountType === AccountType.STUDENT)) {
        user.group = {
            'group_id': data.group_id,
            'group_name': ''.concat(data.specialty_id, data.course, data.subgroup),
            'specialty_id': data.specialty_id,
            'specialty_name': data.specialty_name,
            'course': data.course,
            'subgroup': data.subgroup
        };
    }

    res.status(200).json(user);
});

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

router.post('/users/logout', [
    param('id')
        .exists().withMessage('This parameter is required.')
        .isInt().toInt().withMessage('The value should be of type integer.')
], [
    middlewares.validateData,
    middlewares.loginRequired
], async (req, res) => {
    req.session.destroy();

    res.status(200).end();
});

module.exports = router
