const { Router } = require('express');
const { body, param } = require('express-validator');
const router = Router();

const AppError = require('../helpers/AppError');
const middlewares = require('./middlewares');
const AccountType = require('../helpers/AccountType');
const HashHelper = require('../helpers/HashHelper');

const {
    getAccountTypeByUserId,
    getUserInfo,
    getUserByEmail,
    setFirstName,
    setLastName,
    setFatherName,
    setPhoneNumber,
    deleteUser,
    setActivationStatus,
} = require('../mysql/user.commands');

const {
    getStudentData,
} = require('../mysql/student.commands');

const {
    getTeacherData,
} = require('../mysql/teacher.commands');

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

    const user = await getUserByEmail(data.email);
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

    const sessionData = {};
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
    user.is_activated = Boolean(user.is_activated);

    delete user.account_type_id;
    delete user.account_type_name;

    let data = null;

    switch (user.account_type.id) {
        case AccountType.STUDENT:
            data = await getStudentData(id);

            break;
        case AccountType.TEACHER:
            data = await getTeacherData(id);

            user.is_curator = data !== null;

            break;
    }

    const accountType = await getAccountTypeByUserId(req.session.userId);

    // if the current user is not the requested one or admin or teacher
    // and
    // if requested user is not admin or teacher then remove email & phone fields
    if ((accountType !== AccountType.TEACHER || accountType !== AccountType.ADMINISTRATOR)
            && req.session.userId !== id
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

router.post('/users/:id/logout', [
    param('id')
        .exists().withMessage('This parameter is required.')
        .isInt().toInt().withMessage('The value should be of type integer.')
], [
    middlewares.validateData,
    middlewares.loginRequired
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
        .exists().withMessage('This parameter is required.')
], [
    middlewares.validateData,
    middlewares.loginRequired
], async (req, res) => {
    if (req.session.userId !== req.params.id && !req.session.isAdmin) {
        throw new AppError('Access forbidden.', 403);
    }

    const result = await setFirstName(req.params.id, req.body.first_name);

    res.status(result ? 201 : 404).end();
});

router.put('/users/:id/last-name', [
    param('id')
        .exists().withMessage('This parameter is required.')
        .isInt().toInt().withMessage('The value should be of type integer.'),
    body('last_name')
        .exists().withMessage('This parameter is required.')
], [
    middlewares.validateData,
    middlewares.loginRequired
], async (req, res) => {
    if (req.session.userId !== req.params.id && !req.session.isAdmin) {
        throw new AppError('Access forbidden.', 403);
    }

    const result = await setLastName(req.params.id, req.body.last_name);

    res.status(result ? 201 : 404).end();
});

router.put('/users/:id/father-name', [
    param('id')
        .exists().withMessage('This parameter is required.')
        .isInt().toInt().withMessage('The value should be of type integer.'),
    body('father_name')
        .exists().withMessage('This parameter is required.')
], [
    middlewares.validateData,
    middlewares.loginRequired
], async (req, res) => {
    if (req.session.userId !== req.params.id && !req.session.isAdmin) {
        throw new AppError('Access forbidden.', 403);
    }

    const result = await setFatherName(req.params.id, req.body.father_name);

    res.status(result ? 201 : 404).end();
});

router.put('/users/:id/phone', [
    param('id')
        .exists().withMessage('This parameter is required')
        .isInt().toInt().withMessage('The value should be of type integer.'),
    body('phone')
        .exists().withMessage('This parameter is required')
        .isMobilePhone().withMessage('This mobile number is incorrect')
], [
    middlewares.validateData,
    middlewares.loginRequired
], async (req, res) => {
    if (req.session.userId !== req.params.id && !req.session.isAdmin) {
        throw new AppError('Access forbidden.', 403);
    }

    const result = await setPhoneNumber(req.params.id, req.body.phone);

    res.status(result ? 201 : 404).end();
});

router.delete('/users/:id',
    param('id')
        .exists().withMessage('This parameter is required')
        .isInt().toInt().withMessage('The value should be of type integer.'),
[
    middlewares.validateData,
    middlewares.loginRequired,
    middlewares.adminPrivilegeRequired
], async (req, res) => {
    if (req.session.userId === req.params.id) {
        throw new AppError('Access forbidden.', 403);
    }

    const result = await deleteUser(req.params.id);

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
    const status = req.body.is_activated;
    const result = await setActivationStatus(req.params.id, status);

    if (!status) {
        await req.session.store.deleteSessionsByUserId(req.params.id);
    }

    res.status(result ? 201 : 500).end();
});

module.exports = router
