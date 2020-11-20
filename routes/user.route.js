const { Router } = require("express");
const { body, param, query } = require("express-validator");
const router = Router();

const bcrypt = require('bcrypt');
const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS);

const AppError = require('../helpers/AppError');
const QueryHelper = require("../helpers/QueryHelper");
const middlewares = require('./middlewares');

const AccountType = {
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
    data.account_type = AccountType.ENROLLEE;
    
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
], async (req, res, next) => {
    const queries = req.query;
    const whereClause = (() => {
        const conditions = [];

        if (queries.is_activated) {
            conditions.push('s.is_activated = ' + queries.is_activated);
        }

        if (queries.group_id) {
            conditions.push('s.group_id = ' + queries.group_id);
        }

        return conditions.join(' AND ');
    })();

    let sql = 'SELECT DISTINCT u.id, u.first_name, u.last_name, u.father_name, u.phone, u.email, s.group_id, s.is_activated, g.specialty_id, sp.name as specialty_name, g.course, g.subgroup FROM user as u, student as s, `group` as g, specialty as sp WHERE u.id = s.user_id AND u.account_type = 3 AND g.specialty_id = sp.id AND g.id = s.group_id ';
    sql += (whereClause) ? ' AND ' + whereClause : '';
    sql += (queries.order_by) ? (' ORDER BY ' + queries.order_by + ' ') + ((queries.order) ? queries.order : ' asc') : '';
    sql += ' LIMIT ' + queries.count;
    sql += (queries.page) ? (' OFFSET ' + ((queries.count * queries.page) - queries.count)) : '';

    const accountType = await getAccountTypeByUserId(req.session.user_id);

    QueryHelper
        .query(sql)
            .ifEmpty(() => res.status((queries.page) ? 404 : 204).end())
            .preprocess((result) => {
                const students = result.rows;

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

                return students;
            })
        .query('SELECT COUNT (id) FROM user WHERE account_type = ?')
            .withParams(AccountType.STUDENT)
            .preprocess((result) => result.getValue())
        .processAll((students, count) => {
            res.status(200).json({
                'page_count': Math.ceil(count / queries.count),
                'current_item_count': students.length,
                'result': students
            });
        })
        .commit()
        .catch((reason) => {
            console.log(reason);

            next(reason);
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
