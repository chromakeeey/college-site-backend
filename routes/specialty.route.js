const { Router } = require("express");
const router = Router();

const Specialty = require('../mysql/specialty.commands');

router.get('/specialties', async (req, res) => {
    const specialties = await Specialty.getSpecialties();

    console.log(specialties);

    if (!specialties.length) {
        return res.status(204).end();
    }

    res.status(200).json(specialties);
});

module.exports = router;
