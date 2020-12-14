const { Router } = require("express");
const { body, param, query } = require("express-validator");

const router = Router();
const AccountType = require('../helpers/AccountType');
const AppError = require('../helpers/AppError');
const middlewares = require('./middlewares');

const ParentNumber = require('../mysql/parent_number.commands');

const validateUserIdAndAccountType = async (req, res, next) => {
    const accountType = req.session.accountType;
    const userId = req.session.userId;
    const isAdmin = req.session.isAdmin;
    const belongsToStudent = await ParentNumber.checkIfBelongsToStudent(req.params.id, userId);

    if ((!belongsToStudent && !isAdmin)
            || accountType == AccountType.ENROLLEE
            || accountType == AccountType.TEACHER) {
        throw new AppError('Access forbidden.', 403);
    }

    next();
};

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
    middlewares.loginRequired,
    validateUserIdAndAccountType
], async (req, res) => {
    const body = req.body;

    await ParentNumber.addParentNumber({
        userId: body.user_id,
        firstName: body.first_name,
        lastName: body.last_name,
        role: body.role,
        phone: body.phone
    });
    
    return res.status(200).end();
});

router.put('/parent-numbers/:id/first-name', [
    param('id')
        .exists().withMessage('This parameter is required.')
        .isInt().toInt().withMessage('The value should be of type integer.'),
    body('first_name')
        .exists().withMessage('This parameter is required.')
        .isLength({
            min: 2,
            max: 128
        }).withMessage('The value must be at least 8 characters and no more than 128 characters.')
], [
    middlewares.validateData,
    middlewares.loginRequired,
    validateUserIdAndAccountType
], async (req, res) => {
    const result = await ParentNumber.setParentLastName(req.params.id, req.body.first_name);

    res.status(result ? 201 : 404).end();
});

router.put('/parent-numbers/:id/last-name', [
    param('id')
        .exists().withMessage('This parameter is required.')
        .isInt().toInt().withMessage('The value should be of type integer.'),
    body('last_name')
        .exists().withMessage('This parameter is required.')
        .isLength({
            min: 2,
            max: 128
        }).withMessage('The value must be at least 8 characters and no more than 128 characters.')
], [
    middlewares.validateData,
    middlewares.loginRequired,
    validateUserIdAndAccountType
], async (req, res) => {
    const result = await ParentNumber.setParentLastName(req.params.id, req.body.last_name);

    res.status(result ? 201 : 404).end();
});

router.put('/parent-numbers/:id/phone', [
    param('id')
        .exists().withMessage('This parameter is required')
        .isInt().toInt().withMessage('The value should be of type integer.'),
    body('phone')
        .exists().withMessage('This parameter is required')
        .isMobilePhone().withMessage('This mobile number is incorrect')
], [
    middlewares.validateData,
    middlewares.loginRequired,
    validateUserIdAndAccountType
], async (req, res) => {
    const result = await ParentNumber.setParentPhoneNumber(req.params.id, req.body.phone);

    res.status(result ? 201 : 404).end();
});

router.put('/parent-numbers/:id/role', [
    param('id')
        .exists().withMessage('This parameter is required')
        .isInt().toInt().withMessage('The value should be of type integer.'),
    body('role')
        .exists().withMessage('This parameter is required')
        .isLength({
            min: 2,
            max: 128
        }).withMessage('The value must be at least 8 characters and no more than 128 characters.'),
], [
    middlewares.validateData,
    middlewares.loginRequired,
    validateUserIdAndAccountType
], async (req, res) => {
    const result = await ParentNumber.setParentRole(req.params.id, req.body.role);

    res.status(result ? 201 : 404).end();
});

router.delete('/parent-numbers/:id',
    param('id')
        .exists().withMessage('This parameter is required')
        .isInt().toInt().withMessage('The value should be of type integer.'),
[
    middlewares.validateData,
    middlewares.loginRequired,
    validateUserIdAndAccountType
], async (req, res) => {
    const result = await ParentNumber.deleteParent(req.params.id);

    res.status(result ? 200 : 404).end();
});

router.get('/parent-numbers', [
    query('user_id')
        .isInt().toInt().withMessage('The value should be of type integer.')
], [
    middlewares.validateData,
    middlewares.loginRequired
], async (req, res) => {
    const accountType = req.session.accountType;
    const userId = req.session.userId;
    const isAdmin = req.session.isAdmin;

    // if NOT teacher OR admin OR student AND student specified someone else's user id
    if ((userId != req.query.user_id && (!isAdmin && accountType != AccountType.TEACHER))
            || accountType == AccountType.ENROLLEE) {
        throw new AppError('Access forbidden.', 403);
    }

    const parents = await ParentNumber.getParents(req.query.user_id);

    if (!parents.length) {
        return res.status(204).end();
    }

    res.status(200).json(parents);
});

module.exports = router
