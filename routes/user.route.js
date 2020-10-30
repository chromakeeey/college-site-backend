const { Router } = require("express");
const router = Router();

const { addUser, getUser, getUserSubjects, addUserSubject } = require('../mysql/user.commands')

router.get('/user/get', async (req, res) => {
    try {
        const { userid } = req.body

        getUser(userid, (result) => {
            res.status(201).json(result);
        })

    } catch(e) {
        console.log(e);
        res.status(500).json({ message: "An error occurred" });
    }
})

router.get('/user/subject/get', async (req, res) => {
    try {
        const { user_id } = req.body

        getUserSubjects(user_id, (result) => {
            res.status(201).json(result);
        })    

    } catch(e) {
        console.log(e);
        res.status(500).json({ message: "An error occurred" });
    }
} )

router.post('/user/subject/add', async (req, res) => {
    try {
        const { user_id, subject_id } = req.body

        addUserSubject(user_id, subject_id, (result) => {
            res.status(201).json(result);
        })    

    } catch(e) {
        console.log(e);
        res.status(500).json({ message: "An error occurred" });
    }
} )

router.post('/user/add', async (req, res) => {
    try {
        const user = req.body

        addUser(user, (result) => {
            res.status(201).json(result);
        } )
 
    } catch(e) {
        console.log(e);
        res.status(500).json({ message: "An error occurred" });
    }
})

module.exports = router