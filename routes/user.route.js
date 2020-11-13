const { Router } = require("express");
const { body, validationResult } = require("express-validator");
const router = Router();

const bcrypt = require('bcrypt');
const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS);

const {
    checkIfUserExists,
    getUserByEmail,
    addUser,
    getUser,
    getUserSubjects,
    addUserSubject
} = require('../mysql/user.commands');

router.get('/user/get', async (req, res) => {
    try {
        const { userid } = req.body

        getUser(userid, (result) => {
            res.status(200).json(result);
        })

    } catch(e) {
        console.error(e);

        res.status(500).json({ message: "An error occurred" });
    }
})

router.get('/user/subject/get', async (req, res) => {
    try {
        const { user_id } = req.body

        getUserSubjects(user_id, (result) => {
            res.status(200).json(result);
        })

    } catch(e) {
        console.error(e);

        res.status(500).json({ message: "An error occurred" });
    }
} )

router.post('/user/subject/add', async (req, res) => {
    try {
        const { user_id, subject_id } = req.body

        addUserSubject(user_id, subject_id, (result) => {
            res.status(200).json(result);
        })

    } catch(e) {
        console.log(e);
        res.status(500).json({ message: "An error occurred" });
    }
} )

router.post('/users', [
    body('first_name').isLength({
        min: 2,
        max: 128
    }),
    body('last_name').isLength({
        min: 2,
        max: 128
    }),
    body('father_name').isLength({
        min: 2,
        max: 128
    }),
    body('email').isEmail(),
    body('phone').isMobilePhone(),
    body('password').isLength({
        min: 8,
    }),
], async (req, res) => {
    const data = req.body;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        checkIfUserExists(data.email, (exists) => {
            if (exists) {
                return res.status(409).json({ message: 'The email address is in use.' });
            }

            bcrypt.genSalt(saltRounds).then((salt) => {
                bcrypt.hash(data.password, salt).then((hash) => {
                    data.password = hash;
                    addUser(data, (result) => {
                        res.status(200).end();
                    });
                });
            });
        });
    } catch (e) {
        console.error(e);

        res.status(500).json({ message: "An error occurred" });
    }
});

router.post('/users/auth', [
    body('email').isEmail(),
    body('password').isLength({
        min: 8,
    }),
], async (req, res) => {
    const data = req.body;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    // if logged in send a message
    if (req.session.user_id) {
        return res.status(200).json({ message: 'You are already logged in.' });
    }

    try {
        checkIfUserExists(data.email, (exists) => {
            if (!exists) {
                return res.status(404).json({ message: 'The email address cannot be found.' });
            }

            getUserByEmail(data.email, (user) => {
                if (user === null) {
                    return res.status(500).json({ message: 'An error occurred' });
                }

                bcrypt.compare(data.password, user.password).then((result) => {
                    if (!result) {
                        return res.status(401).json({ message: 'Password doesn not match.' });
                    }

                    req.session.user_id = user.id;
                    res.status(200).end();
                })
            });
        });
    } catch (e) {
        console.error(e);

        res.status(500).json({ message: "An error occurred" });
    }
});

module.exports = router
