const { Router } = require("express");
const router = Router();

const { selectAllSubjects, addSubject, getSubject } = require('../mysql/subject.commands')

router.get('/subject/all', async (req, res) => {
    try {
        selectAllSubjects((result) => {
            res.status(201).json(result);
        })

    } catch(e) {
        console.log(e);
        res.status(500).json({ message: "An error occurred" });
    }
})

router.post('/subject/add', async (req, res) => {
    try {
        const { subject } = req.body

        addSubject(subject, (result) => {
            res.status(201).json(result);
        })

    } catch(e) {
        console.log(e);
        res.status(500).json({ message: "An error occurred" });
    }
})

router.get('/subject/get', async (req, res) => {
    try {
        const { subject_id } = req.body

        getSubject(subject_id, (result) => {
            res.status(201).json(result);
        })

    } catch(e) {
        console.log(e);
        res.status(500).json({ message: "An error occurred" });
    }
})

module.exports = router