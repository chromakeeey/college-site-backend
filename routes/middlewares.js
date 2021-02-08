
const { validationResult } = require('express-validator');
const AppError = require('../helpers/AppError');

const loginRequired = (req, res, next) => {
    if (!req.session.exists()) {
        throw new AppError('You are not authorized.', 401);
    }

    next();
};

const adminPrivilegeRequired = (req, res, next) => {
    if (!req.session.isAdmin) {
        throw new AppError('Admin priviledge required.', 403);
    }

    next();
};

const validateData = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array(), });
    }

    next();
};

module.exports = {
    loginRequired,
    adminPrivilegeRequired,
    validateData,
};
