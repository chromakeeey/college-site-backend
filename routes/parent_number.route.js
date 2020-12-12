const { Router } = require("express");
const { body } = require("express-validator");

const router = Router();
const AccountType = require('../helpers/AccountType');
const AppError = require('../helpers/AppError');
const middlewares = require('./middlewares');

const ParentNumber = require('../mysql/parent_number.commands');

router.post('/parent-numbers', [
    body('user_id')
        .exists().withMessage('This parameter is required.')
        .isInt().toInt().withMessage('The value should be of type integer.'),
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
    body('phone')
        .exists().withMessage('This parameter is required.')
        .isMobilePhone().withMessage('The value should be a valid phone number.'),
    body('role')
        .exists().withMessage('This parameter is required.')
        .isLength({
            min: 2,
            max: 128
        }).withMessage('The value should be in a range from 2 to 128 characters long.'),
], [
    middlewares.loginRequired
], async (req, res) => {
    const body = req.body;
    const accountType = req.session.accountType;
    const userId = req.session.userId;

    if (accountType == AccountType.TEACHER || accountType == AccountType.ENROLLEE
            || accountType == AccountType.STUDENT && userId != body.user_id) {
        throw new AppError('Access forbidden.', 403);
    }

    await ParentNumber.addParentNumber({
        userId: body.user_id,
        firstName: body.first_name,
        lastName: body.last_name,
        role: body.role,
        phone: body.phone
    });
    
    return res.status(200).end();
});

module.exports = router
