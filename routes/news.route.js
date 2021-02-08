const { Router } = require('express');
const { query, param } = require('express-validator');
const router = Router();
const multer = require('multer');
const upload = multer({ dest: './public/uploads/images' });
const middlewares = require('./middlewares');
const fs = require('fs');

const AppError = require('../helpers/AppError');
const News = require('../mysql/news.commands');
const AccountType = require('../helpers/AccountType');
const Group = require('../mysql/group.commands');

router.post('/news', [
    middlewares.loginRequired,
], upload.single('image'), async (req, res) => {
    const errors = [];
    const returnError = (param, msg) => {
        errors.push({
            location: 'form-data',
            msg: msg,
            param: param,
        });
    };

    if (!req.body.title) {
        returnError('title', 'This parameter is required.');
    } else if (req.body.title.length < 2 || req.body.title.length > 200) {
        returnError('title', 'The value should be in a range from 2 to 128 characters long.');
    }

    if (!req.body.content) {
        returnError('content', 'This parameter is required.');
    }

    if (req.body.group_id) {
        req.body.group_id = Number.parseInt(req.body.group_id);

        if (req.body.group_id === NaN) {
            returnError('group_id', 'The value should be of type integer.');
        }
    }

    if (!req.file) {
        returnError('image', 'This parameter is required.');
    }

    if (req.file && !req.file.mimetype.includes('image')) {
        returnError('image', 'This file should be an image.');
    }

    if (errors.length) {
        return res.status(400).json({ errors: errors });
    }

    if (!req.session.isAdmin || !(await Group.isCurator(req.session.userId, queries.group_id))) {
        await fs.unlinkSync(req.file.path);

        throw new AppError('Access forbidden.', 403);
    }

    const extension = req.file.originalname.split('.')[1];
    await fs.renameSync(req.file.path, `${req.file.path}.${extension}`);
    req.file.path += `.${extension}`;
    req.file.filename += `.${extension}`;

    console.log(req.file);

    const id = (!req.body.group_id) ? await News.addNews({
        title: req.body.title,
        imageName: req.file.filename,
        content: req.body.content,
    }) : await News.addGroupNews({
        title: req.body.title,
        imageName: req.file.filename,
        content: req.body.content,
        groupId: req.body.group_id,
    });

    res.status(201).json({ id: id });
});

router.get('/news', [
    query('count')
        .exists().withMessage('This parameter is requried.')
        .custom((value) => value > 0).withMessage('Count should be greater than 0.')
        .isInt().toInt().withMessage('The value should be of type integer.'),
    query('page')
        .isInt().toInt().withMessage('Page number should be of type integer.')
        .custom((value) => value > 0).withMessage('Page number should be greater than 0.')
        .optional(),
    query('group_id')
        .isInt().toInt().withMessage('The value should be of type integer.')
        .optional(),
], [
    middlewares.validateData,
    middlewares.loginRequired,
], async (req, res) => {
    const queries = req.query;
    const accountType = await User.getAccountTypeByUserId(req.session.userId);
    const offset = (queries.page) ? (queries.count * queries.page) - queries.count : 0;

    if (queries.group_id && (accountType != AccountType.TEACHER || accountType != AccountType.STUDENT || accountType != AccountType.ADMINISTRATOR)) {
        throw new AppError('Access forbidden.', 403);
    } else if (queries.group_id && accountType != AccountType.ADMINISTRATOR) {
        let result = false;

        if (accountType == AccountType.TEACHER) {
            result = await Group.isCurator(req.session.userId, queries.group_id);
        } else {
            result = await Group.isGroupMember(req.session.userId, queries.group_id);
        }

        if (result) {
            throw new AppError('Access forbidden.', 403);
        }
    }

    const news = await News.getNews({
        offset: offset,
        limit: queries.count,
        groupId: queries.group_id,
    });

    news.forEach((news) => {
        news.image_url = `${req.protocol}://${req.hostname}:${process.env.PORT}/uploads/images/${news.image_name}`;

        delete news.image_name;
    });

    if (!news.length) {
        return res.status((queries.page) ? 404 : 204).end();
    }

    const newsCount = await News.getNewsCount(queries.group_id);
    const pageCount = Math.ceil(newsCount / queries.count);

    res.status(200).json({
        'page_count': pageCount,
        'current_item_count': news.length,
        'result': news
    });
});

router.delete('/news/:id', [
    param('id')
        .exists().withMessage('This parameter is required')
        .isInt().toInt().withMessage('The value should be of type integer.'),
], [
    middlewares.validateData,
    middlewares.loginRequired,
    middlewares.adminPrivilegeRequired
], async (req, res) => {
    const result = await News.deleteNews(req.params.id);

    res.status(result ? 200 : 404).end();
});

module.exports = router;
