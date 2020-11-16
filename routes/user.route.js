const { Router } = require("express");
const { body, param } = require("express-validator");
const router = Router();

const bcrypt = require('bcrypt');
const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS);

const AppError = require('../helpers/AppError');
const middlewares = require('./middlewares');

const userType = {
    ADMINISTRATOR: 1,
    TEACHER: 2,
    STUDENT: 3,
    ENROLLEE: 4
};

const {
    checkIfEmailUsed,
    getAccountTypeByUserId,
    isStudentAccountActivated,
    getStudentData,
    getUserInfo,
    addStudentData,
    getTeacherData,
    getUserByEmail,
    addUser,
    setStudentActivation,
} = require('../mysql/user.commands');

const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(saltRounds);

    return await bcrypt.hash(password, salt);
};

router.post('/enrollees', [
    body('first_name').isLength({
        min: 2,
        max: 128
    }),
    body('last_name').isLength({
        min: 2,
        max: 128
    }),
    body('father_name').isLength({
        min: 2,
        max: 128
    }),
    body('email').isEmail(),
    body('phone').isMobilePhone(),
    body('password').isLength({
        min: 8,
    }),
], middlewares.validateData, async (req, res) => {
    const data = req.body;
    const emailUsed = await checkIfEmailUsed(data.email);

    if (emailUsed) {
        throw new AppError('The email address is in use.', 409);
    }

    const hash = await hashPassword(data.password);
    data.password = hash;
    data.account_type = userType.ENROLLEE;
    
    await addUser(data);
    res.status(200).end();
});

router.post('/students', [
    body('first_name').isLength({
        min: 2,
        max: 128
    }),
    body('last_name').isLength({
        min: 2,
        max: 128
    }),
    body('father_name').isLength({
        min: 2,
        max: 128
    }),
    body('email').isEmail(),
    body('phone').isMobilePhone(),
    body('password').isLength({
        min: 8,
    }),
    body('group_id').isNumeric(),
], middlewares.validateData, async (req, res) => {
    const data = req.body;
    const emailUsed = await checkIfEmailUsed(data.email);

    if (emailUsed) {
        throw new AppError('The email address is in use.', 409);
    }

    const hash = await hashPassword(data.password);
    data.password = hash;
    data.account_type = accountType.STUDENT;

    const userId = await addUser(data);
    await addStudentData({
        user_id: userId,
        group_id: data.group_id,
        is_activated: false
    })

    res.status(202).end();
});

router.post('/users/auth', [
    body('email').isEmail(),
    body('password').isLength({
        min: 8,
    }),
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

    const match = await bcrypt.compare(data.password, user.password);
    if (!match) {
        throw new AppError('Password doesn not match.', 401);
    }

    switch (user.account_type) {
        case accountType.ADMINISTRATOR:
            req.session.is_admin = true;
            
            break;
        case accountType.STUDENT:
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
    param('id').toInt(),
], [
    middlewares.validateData,
    middlewares.loginRequired,
], async (req, res) => {
    const id = req.params.id;
    const user = await getUserInfo(id);

    switch (user.account_type) {
        case accountType.STUDENT:
            const studentData = await getStudentData(id);
            user = Object.assign(user, studentData);

            break;
        case accountType.TEACHER:
            const teacherData = await getTeacherData(id);

            if (!teacherData) {
                user.group_id = teacherData.group_id;
            }
            break;
    }

    const accountType = await getAccountTypeByUserId(req.session.user_id);

    // if the current user is not the requested one or admin or teacher
    // and
    // if requested user is not admin or teacher then remove email & phone fields
    if ((accountType !== accountType.TEACHER || accountType !== accountType.ADMINISTRATOR)
            && req.session.user_id !== id
            && user.account_type_id !== accountType.TEACHER
            && user.account_type_id !== accountType.ADMINISTRATOR) {
        delete user.email;
        delete user.phone;
    }

    res.status(200).json(user);
});

router.put('/students/:id/activated', [
    param('id').isInt().toInt(),
    body('is_activated').isBoolean().toBoolean(),
], [
    middlewares.validateData,
    middlewares.loginRequired,
    middlewares.adminPrivilegeRequired,
], async (req, res) => {
    const { is_activated } = req.body;

    await setStudentActivation(req.params.id, is_activated);

    res.status(201).end();
});

module.exports = router
