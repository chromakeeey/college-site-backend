require('dotenv').config()
require('express-async-errors')

const express = require("express")

const app = express()
const session = require('express-session')
const morgan = require('morgan');
const cors = require('cors')

const { MemoryStore } = require('express-session')

const PORT = process.env.PORT;

app.use(express.json({extended: true}))
app.use(cors())
app.use(morgan('dev'));

app.use(session({
    store: new MemoryStore(),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        maxAge: (((60 * 1000) * 60) * 24) * 4, // 4 days
    },
    rolling: true
}))

app.use('/api/', require('./routes/user.route'));
app.use('/api/', require('./routes/group.route'));

app.get('/', (req, res) => {
    res.end('<h1>College site API</h1>')
})

app.use((err, req, res, next) => {
    if (err.isOperational) {
        res.status(err.statusCode).json({
            message: err.message
        });
    } else {
        res.status(500).json({
            message: 'Something went wrong.'
        });
    }

    next(err);
});

app.listen(process.env.PORT, () => {
    console.log(`App has been started on port ${PORT}...`)
});
