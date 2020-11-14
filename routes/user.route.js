const { Router } = require("express");
const { body, validationResult, param } = require("express-validator");
const router = Router();

const bcrypt = require('bcrypt');
const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS);

const {
    checkIfEmailUsed,
    getAccountTypeByUserId,
    isStudentAccountActivated,
    checkIfUserExists,
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
], async (req, res) => {
    const data = req.body;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const emailUsed = await checkIfEmailUsed(data.email);

    if (emailUsed) {
        return res.status(409).json({ message: 'The email address is in use.' });
    }

    const hash = await hashPassword(data.password);
    data.password = hash;
    data.account_type = 4; // enrollee
    
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
], async (req, res) => {
    const data = req.body;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const emailUsed = await checkIfEmailUsed(data.email);

    if (emailUsed) {
        return res.status(409).json({ message: 'The email address is in use.' });
    }

    const hash = await hashPassword(data.password);
    data.password = hash;
    data.account_type = 3; // student

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
], async (req, res) => {
    const data = req.body;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    // if logged in send a message
    if (req.session.user_id) {
        return res.status(200).json({ message: 'You are already logged in.' });
    }

    const isEmailUsed = await checkIfEmailUsed(data.email);
    if (!isEmailUsed) {
        return res.status(404).json({ message: 'The email address cannot be found.' });
    }

    const user = await getUserByEmail(data.email);
    if (user === null) {
        return res.status(500).json({ message: 'An error occurred' });
    }

    const match = await bcrypt.compare(data.password, user.password);

    if (!match) {
        return res.status(401).json({ message: 'Password doesn not match.' });
    }

    if (user.account_type === 1) { // If it's an admin
        req.session.user_id = user.id;
        req.session.is_admin = true;

        return res.status(200).json({ id: user.id });
    }

    if (user.account_type === 3) { // If it's a student
        const isActivated = await isStudentAccountActivated(user.id);

        if (activated) {
            req.session.user_id = user.id;
            return res.status(200).json({ id: user.id });
        }

        return res.status(403).json({ message: 'You cannot login! Wait for an administrator to approve your registration.' });
    }
    
    req.session.user_id = user.id;
    res.status(200).json({ id: user.id });
});

router.get('/users/:id', [
    param('id').toInt(),
], async (req, res) => {
    const errors = validationResult(req);
    const id = req.params.id;

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    if (!req.session.user_id) {
        return res.status(401).json({ message: 'You are not authorized.' });
    }

    const userExists = await checkIfUserExists(id);

    if (!userExists) {
        return res.status(404).json({ message: 'User not found.' });
    }

    const user = await getUserInfo(id);

    if (user.account_type_id === 3) { // If student then include student's data
        const studentData = await getStudentData(id);
        
        user.group_id = studentData.group_id;
        user.is_activated = studentData.is_activated;
    } else if (user.account_type_id === 2) { // If teacher then include teacher's data
        const teacherData = getTeacherData(id);

        if (teacherData.length !== 0) {
            user.group_id = teacherData.group_id;
        }
    }

    const accountType = await getAccountTypeByUserId(req.session.user_id);

    // if the current user is not the requested one or admin or teacher
    // and
    // if requested user is not admin or teacher then remove email & phone fields
    if ((accountType !== 2 || accountType !== 1) && req.session.user_id !== id && user.account_type_id !== 2 && user.account_type_id !== 1) {
        delete user.email;
        delete user.phone;
    }

    res.status(200).json(user);
});

router.put('/students/:id/activated', [
    param('id').isInt().toInt(),
    body('is_activated').isBoolean().toBoolean(),
], async (req, res) => {
    const errors = validationResult(req);
    const { is_activated } = req.body;

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    if (!req.session.user_id || !req.session.is_admin) {
        return res.status(401).json({ message: 'You are not authorized.' });
    }

    await setStudentActivation(req.params.id, is_activated);
    res.status(2001).end();
});

module.exports = router
