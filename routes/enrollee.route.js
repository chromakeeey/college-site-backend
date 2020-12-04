const { Router } = require("express");
const { body } = require("express-validator");
const router = Router();

const AppError = require('../helpers/AppError');
const middlewares = require('./middlewares');
const AccountType = require('../helpers/AccountType');
const HashHelper = require("../helpers/HashHelper");

const User = require('../mysql/user.commands');

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
    const emailUsed = await User.checkIfEmailUsed(data.email);

    if (emailUsed) {
        throw new AppError('The email address is in use.', 409);
    }

    const hash = await HashHelper.hash(data.password);

    await User.addUser({
        firstName: data.first_name,
        lastName: data.last_name,
        fatherName: data.father_name,
        email: data.email,
        phone: data.phone,
        accountType: AccountType.ENROLLEE,
        isActivated: true,
        password: hash
    });
    res.status(200).end();
});

module.exports = router
