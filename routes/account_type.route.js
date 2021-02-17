const { Router } = require('express');

const router = Router();
const middlewares = require('./middlewares');

const AccountTypes = require('../mysql/account_type.commands');

router.get('/account-types', [
    middlewares.loginRequired
], async (req, res) => {
    const accountTypes = await AccountTypes.getListOfAccountTypes();

    if (!accountTypes.length) {
        return res.status(204).end();
    }

    res.status(200).json(accountTypes);
});

module.exports = router;
