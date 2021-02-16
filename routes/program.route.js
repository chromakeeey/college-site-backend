const { Router } = require("express");
const router = Router();
const { body, param } = require("express-validator");

const Program = require('../mysql/program.commands');
const middlewares = require('./middlewares');

router.post('/programs', [
    body('specialty_id').isInt(),
    body('course').isInt(),
    body('subject_id').isInt(),
    body('name').isLength({
        min: 2,
        max: 128
    }),
    body('first_semester').isInt(),
    body('last_semester').isInt()
], [
    middlewares.loginRequired
], async (req, res) => {
    const program = req.body;
    const insertedId = await Program.addProgram(program);

    res.status(200).json(insertedId);
})

router.get('/programs', [
    middlewares.loginRequired
], async (req, res) => {
    const programs = await Program.getAllProgramList()

    res.status(200).json(programs);
})

router.get('/programs/course/:courseNumber/specialty/:specialtyId', [
    param('courseNumber').toInt(),
    param('specialtyId').toInt()
], [
    middlewares.loginRequired
], async (req, res) => {
    const course = req.params.courseNumber;
    const specialtyId = req.params.specialtyId;
    const programs = await Program.getProgramList(course, specialtyId)

    res.status(200).json(programs);
})

router.get('/programs/:programId', [
    param('programId').toInt()
], [
    middlewares.loginRequired
], async (req, res) => {
    const programId = req.params.programId;
    const program = await Program.getProgramAndThemes(programId);

    res.status(200).json(program);
})

router.get('/programs/:programId/theme_type/:themeTypeId', [
    param('programId').toInt(),
    param('themeTypeId').toInt()
], [
    middlewares.loginRequired
], async (req, res) => {
    const programId = req.params.programId;
    const themeTypeId = req.params.themeTypeId;
    const program = await Program.getProgramAndThemesByType(programId, themeTypeId);

    res.status(200).json(program);
})

router.put('/programs/:programId/name', [
    param('programId').toInt(),
    body('name').isLength({
        min: 2,
        max: 64
    }).withMessage('Min length of name - 2, max - 64')
], [
    middlewares.loginRequired
], async (req, res) => {
    const programId = req.params.programId;
    const { name } = req.body;

    await Program.changeProgramName(programId, name);

    res.status(200).end();
})

router.delete('/programs/:programId', [
    param('programId').toInt()
], [
    middlewares.loginRequired
], async (req, res) => {
    const programId = req.params.programId;

    await Program.deleteProgram(programId);

    res.status(200).end();
})

module.exports = router;
