const { Router } = require("express");
const { body, param } = require("express-validator");
const router = Router();

const AppError = require('../helpers/AppError');
const middlewares = require('./middlewares');
const AccountType = require('../helpers/AccountType');
const HashHelper = require("../helpers/HashHelper");

const {
    getAccountTypeByUserId,
    getUserInfo,
    getUserByEmail,
} = require('../mysql/user.commands');

const {
    isStudentAccountActivated,
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
