const { Router } = require('express');
const { body } = require('express-validator');

const router = Router();
const AccountType = require('../helpers/AccountType');
const AppError = require('../helpers/AppError');
const middlewares = require('./middlewares');
const HashHelper = require('../helpers/HashHelper');

const Admin = require('../mysql/admin.commands');
const User = require('../mysql/user.commands');

router.post('/admins', [
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
], [
    middlewares.validateData,
    middlewares.loginRequired,
    middlewares.adminPrivilegeRequired
], async (req, res) => {
    const data = req.body;    
    const isEmailUsed = await User.checkIfEmailUsed(data.email);

    if (isEmailUsed) {
        throw new AppError('The email address is in use.', 409);
    }

    const hash = await HashHelper.hash(data.password);
    await Admin.addAdmin({
        firstName: data.first_name,
        lastName: data.last_name,
        fatherName: data.father_name,
        email: data.email,
        phone: data.phone,
        accountType: AccountType.ADMINISTRATOR,
        isActivated: true,
        password: hash,
    });

    res.status(200).end();
});

module.exports = router;
