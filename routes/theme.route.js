const { Router } = require('express');
const router = Router();
const { body, param } = require('express-validator');

const Theme = require('../mysql/theme.commands');
const middlewares = require('./middlewares');

router.post('/themes', [
    body('program_education_id').isInt(),
    body('name').isLength({
        min: 2,
        max: 64
    }).withMessage('Min length of name - 2, max - 64'),
    body('theme_type_id').isInt().withMessage('Only integer value'),
], [
    middlewares.loginRequired,
], async(req, res) => {
    const theme = req.body;
    const insertedId = await Theme.addTheme(theme);

    res.status(200).json(insertedId);
})

router.get('/themes/:themeId', [
    param('themeId').toInt()
], [
    middlewares.loginRequired,
], async (req, res) => {
    const themeId = req.params.themeId;
    const theme = await Theme.getTheme(themeId);

    res.status(200).json(theme);
})

router.delete('/themes/:themeId', [
    param('themeId').toInt()
], [
    middlewares.loginRequired,
], async (req, res) => {
    const themeId = req.params.themeId;
    const affectedRows =  await Theme.deleteTheme(themeId);

    res.status(200).json(affectedRows);
})

module.exports = router;
