const { Router } = require('express');
const { body, param, query } = require('express-validator');
const router = Router();

const AppError = require('../helpers/AppError');
const middlewares = require('./middlewares');
const AccountType = require('../helpers/AccountType');
const HashHelper = require('../helpers/HashHelper');

const User = require('../mysql/user.commands');
const Student = require('../mysql/student.commands');
const Teacher = require('../mysql/teacher.commands');
const AccountTypeSql = require('../mysql/account_type.commands');

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
    if (req.session.exists()) {
        throw new AppError('You are already logged in.', 200);
    }

    const user = await User.getUserByEmail(data.email);
    if (!user) {
        throw new AppError('A user with this email was not found.', 404);
    }

    if (!user.is_activated) {
        throw new AppError('You cannot login! Wait for an administrator to mark your account as activated.', 403);
    }

    const match = await HashHelper.compare(data.password, user.password);
    if (!match) {
        throw new AppError('Password doesn not match.', 401);
    }

    const sessionData = {
        accountType: user.account_type
    };

    if (user.account_type === AccountType.ADMINISTRATOR) {
        sessionData.isAdmin = true;
    }

    await req.session.init(user.id, sessionData);
    res.status(200).json({ id: user.id });
});

router.get('/users/:id', [
    param('id')
        .exists().withMessage('This parameter is required.')
        .isInt().toInt().withMessage('The value should be of type integer.'),
], [
    middlewares.validateData,
    middlewares.loginRequired,
], async (req, res) => {
    const id = req.params.id;
    const user = await User.getUserInfo(id);

    if (!user) {
        throw new AppError('User was not found.', 404);
    }

    user.account_type = {
        'id': user.account_type_id,
        'name': user.account_type_name,
    };
    user.is_activated = Boolean(user.is_activated);

    delete user.account_type_id;
    delete user.account_type_name;

    let data = null;

    switch (user.account_type.id) {
        case AccountType.STUDENT:
            data = await Student.getStudentData(id);

            break;
        case AccountType.TEACHER:
            data = await Teacher.getTeacherData(id);

            user.is_curator = data !== null;

            break;
    }

    const accountType = await User.getAccountTypeByUserId(req.session.userId);

    // if the current user is not the requested one or admin and teacher
    // and
    // if requested user is not admin or teacher then remove email & phone fields
    if ((accountType !== AccountType.TEACHER && accountType !== AccountType.ADMINISTRATOR)
            && req.session.userId !== id
            && user.account_type.id !== AccountType.TEACHER
            && user.account_type.id !== AccountType.ADMINISTRATOR) {
        delete user.email;
        delete user.phone;
    }

    if (data && (user.account_type.id === AccountType.TEACHER || user.account_type.id === AccountType.STUDENT)) {
        user.group = {
            'group_id': data.group_id,
            'group_name': `${data.specialty_id}${data.course}${data.subgroup}`,
            'specialty_id': data.specialty_id,
            'specialty_name': data.specialty_name,
            'course': data.course,
            'subgroup': data.subgroup
        };
    }

    res.status(200).json(user);
});

router.post('/users/:id/logout', [
    param('id')
        .exists().withMessage('This parameter is required.')
        .isInt().toInt().withMessage('The value should be of type integer.'),
], [
    middlewares.validateData,
    middlewares.loginRequired,
], async (req, res) => {
    if (req.params.id === req.session.userId) {
        await req.session.delete();

        return res.status(200).end();
    }

    if (req.session.isAdmin) {
        await req.session.store.deleteSessionsByUserId(req.params.id);

        return res.status(200).end();
    }

    return new AppError('Access forbidden.', 403);
});

router.put('/users/:id/first-name', [
    param('id')
        .exists().withMessage('This parameter is required.')
        .isInt().toInt().withMessage('The value should be of type integer.'),
    body('first_name')
        .exists().withMessage('This parameter is required.'),
], [
    middlewares.validateData,
    middlewares.loginRequired,
], async (req, res) => {
    if (req.session.userId !== req.params.id && !req.session.isAdmin) {
        throw new AppError('Access forbidden.', 403);
    }

    const result = await User.setFirstName(req.params.id, req.body.first_name);

    res.status(result ? 201 : 404).end();
});

router.put('/users/:id/last-name', [
    param('id')
        .exists().withMessage('This parameter is required.')
        .isInt().toInt().withMessage('The value should be of type integer.'),
    body('last_name')
        .exists().withMessage('This parameter is required.'),
], [
    middlewares.validateData,
    middlewares.loginRequired,
], async (req, res) => {
    if (req.session.userId !== req.params.id && !req.session.isAdmin) {
        throw new AppError('Access forbidden.', 403);
    }

    const result = await User.setLastName(req.params.id, req.body.last_name);

    res.status(result ? 201 : 404).end();
});

router.put('/users/:id/father-name', [
    param('id')
        .exists().withMessage('This parameter is required.')
        .isInt().toInt().withMessage('The value should be of type integer.'),
    body('father_name')
        .exists().withMessage('This parameter is required.'),
], [
    middlewares.validateData,
    middlewares.loginRequired,
], async (req, res) => {
    if (req.session.userId !== req.params.id && !req.session.isAdmin) {
        throw new AppError('Access forbidden.', 403);
    }

    const result = await User.setFatherName(req.params.id, req.body.father_name);

    res.status(result ? 201 : 404).end();
});

router.put('/users/:id/phone', [
    param('id')
        .exists().withMessage('This parameter is required')
        .isInt().toInt().withMessage('The value should be of type integer.'),
    body('phone')
        .exists().withMessage('This parameter is required')
        .isMobilePhone().withMessage('This mobile number is incorrect'),
], [
    middlewares.validateData,
    middlewares.loginRequired,
], async (req, res) => {
    if (req.session.userId !== req.params.id && !req.session.isAdmin) {
        throw new AppError('Access forbidden.', 403);
    }

    const result = await User.setPhoneNumber(req.params.id, req.body.phone);

    res.status(result ? 201 : 404).end();
});

router.delete('/users/:id',
    param('id')
        .exists().withMessage('This parameter is required')
        .isInt().toInt().withMessage('The value should be of type integer.'),
[
    middlewares.validateData,
    middlewares.loginRequired,
    middlewares.adminPrivilegeRequired,
], async (req, res) => {
    if (req.session.userId === req.params.id) {
        throw new AppError('Access forbidden.', 403);
    }

    const result = await User.deleteUser(req.params.id);

    res.status(result ? 200 : 404).end();
});

router.put('/users/:id/activated', [
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
    if (req.session.userId === req.params.id) {
        throw new AppError('Access forbidden.', 403);
    }

    const status = req.body.is_activated;
    const result = await User.setActivationStatus(req.params.id, status);

    if (!status) {
        await req.session.store.deleteSessionsByUserId(req.params.id);
    }

    res.status(result ? 201 : 404).end();
});

router.put('/users/:id/email', [
    param('id')
        .exists().withMessage('This parameter is required.')
        .isInt().toInt().withMessage('The value should be of type integer.'),
    body('email')
        .exists().withMessage('This parameter is required.')
        .isEmail().withMessage('The value should be a valid email address.'),
], [
    middlewares.validateData,
    middlewares.loginRequired,
], async (req, res) => {
    if (req.session.userId !== req.params.id && !req.session.isAdmin) {
        throw new AppError('Access forbidden.', 403);
    }

    const emailUsed = await User.checkIfEmailUsed(req.body.email);

    if (emailUsed) {
        throw new AppError('The email address is in use', 409)
    }

    const result = await User.setEmail(req.params.id, req.body.email);

    res.status(result ? 201 : 404).end();
});

router.put('/users/:id/password', [
    param('id')
        .exists().withMessage('This parameter is required.')
        .isInt().toInt().withMessage('The value should be of type integer.'),
    body('password')
        .exists().withMessage('This parameter is required.')
        .isLength({
            min: 8,
        }).withMessage('The value should be at least 8 characters long.'),
], [
    middlewares.validateData,
    middlewares.loginRequired,
], async (req, res) => {
    if (req.session.userId !== req.params.id && !req.session.isAdmin) {
        throw new AppError('Access forbidden.', 403);
    }

    const result = await User.setPassword(req.params.id, await HashHelper.hash(req.body.password));

    res.status(result ? 201 : 404).end();
});

router.get('/users', [
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
            'email',
            'account_type',
            'is_activated'
        ].includes(value)).withMessage('The only acceptable values are \'first_name\', \'last_name\', \'father_name\', \'phone\', \'email\', \'account_type\', \'is_activated\'.'),
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
    query('account_type')
        .isInt().toInt().withMessage('The value should be of type integer.')
        .custom(async (value) => {
            value = Number.parseInt(value);

            if (value == NaN) {
                return false;
            }

            return await AccountTypeSql.isExists(value);
        })
        .optional(),
], [
    middlewares.validateData,
    middlewares.loginRequired,
], async (req, res) => {
    const queries = req.query;
    const accountType = await User.getAccountTypeByUserId(req.session.userId);
    const offset = (queries.page) ? (queries.count * queries.page) - queries.count : 0;
    const ascendingOrder = (queries.order) ? queries.order === 'asc' : true;

    const users = await User.getUsers({
        ascendingOrder: ascendingOrder,
        orderBy: queries.order_by,
        offset: offset,
        limit: queries.count,
        accountType: queries.account_type,
        isActivated: queries.is_activated,
    });

    if (!users.length) {
        return res.status((queries.page) ? 404 : 204).end();
    }

    users.forEach((user) => {
        if ((accountType === AccountType.STUDENT || accountType == AccountType.ENROLLEE) && req.session.userId !== user.id) {
            delete user.email;
            delete user.phone;
        }

        user.account_type = {
            id: user.account_type_id,
            name: user.account_type_name
        };
        user.is_activated = Boolean(user.is_activated);

        delete user.account_type_id;
        delete user.account_type_name;
    });

    const usersCount = await User.getUsersCount({
        isActivated: queries.is_activated,
        accountType: queries.account_type,
    });
    const pageCount = Math.ceil(usersCount / queries.count);

    res.status(200).json({
        'page_count': pageCount,
        'current_item_count': users.length,
        'result': users,
    });
});

module.exports = router;
