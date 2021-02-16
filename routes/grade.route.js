const { Router } = require('express');
const router = Router();
const { body, param } = require('express-validator');

const Grade = require('../mysql/grade.commands');
const middlewares = require('./middlewares');

router.post('/grades', [
    body('program_themes_id').isInt(),
    body('user_id').isInt(),
    body('mark').isInt(),
    body('description').isLength({
        min: 2,
        max: 128
    }),
], [
    middlewares.loginRequired,
], async (req, res) => {
    const grade = req.body;
    const insertedId = await Grade.addGrade(grade);

    res.status(200).json(insertedId);
});

router.get('/grades/program/:programId/theme_type/:themeTypeId/student/:studentId', [
    param('programId').toInt(),
    param('themeTypeId').toInt(),
    param('studentId').toInt(),
], [
    middlewares.loginRequired,
], async (req, res) => {
    const studentId = req.params.studentId;
    const programId = req.params.programId;
    const themeTypeId = req.params.themeTypeId;
    const grades = await Grade.getStudentGradesForTheme(studentId, programId, themeTypeId);

    res.status(200).json(grades);
});

router.get('/grades/program/:programId/theme_type/:themeTypeId/group/:groupId', [
    param('programId').toInt(),
    param('themeTypeId').toInt(),
    param('groupId').toInt(),
], [
    middlewares.loginRequired,
], async (req, res) => {
    const groupId = req.params.groupId;
    const programId = req.params.programId;
    const themeTypeId = req.params.themeTypeId;
    const grades = await Grade.getGroupGradesForTheme(groupId, programId, themeTypeId);

    res.status(200).json(grades);
});

router.delete('/grades/:gradeId', [
    param('gradeId').toInt(),
], [
    middlewares.loginRequired,
], async (req, res) => {
    const gradeId = req.params.gradeId;
    const affectedRows =  await Grade.deleteGrade(gradeId);

    res.status(200).json(affectedRows);
});

module.exports = router;
