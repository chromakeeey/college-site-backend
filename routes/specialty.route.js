const { Router } = require("express");
const router = Router();

const { getAllSpecialty, addSpecialty, getSpecialty } = require('../mysql/specialty.commands')

router.get('/specialty/all', async (req, res) => {
    try {
        getAllSpecialty((result) => {
            res.status(201).json(result);
        })

    } catch(e) {
        console.log(e);
        res.status(500).json({ message: "An error occurred" });
    }
})

router.post('/specialty/add', async (req, res) => {
    try {
        const { specialty } = req.body

        addSpecialty(specialty, (result) => {
            res.status(201).json(result);
        })

    } catch(e) {
        console.log(e);
        res.status(500).json({ message: "An error occurred" });
    }
})

router.get('/specialty/get', async (req, res) => {
    try {
        const { specialty_id } = req.body

        getSpecialty(specialty_id, (result) => {
            res.status(201).json(result);
        })

    } catch(e) {
        console.log(e);
        res.status(500).json({ message: "An error occurred" });
    }
})

module.exports = router