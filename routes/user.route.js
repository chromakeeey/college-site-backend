const { Router } = require("express");
const router = Router();

router.get('/getuser', async (req, res) => {
    try {
        const User = {
            name: 'Oleksandr',
            surname: 'Palamarchuk',
            groupid: 256
        }

        res.status(201).json(User);
    } catch(e) {
        console.log(e);
        res.status(500).json({ message: "An error occurred" });
    }
})

module.exports = router