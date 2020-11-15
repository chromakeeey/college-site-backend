require('dotenv').config()
require('express-async-errors')

const express = require("express")
const config = require("config")

const app = express()
const session = require('express-session')
const morgan = require('morgan');

const { MemoryStore } = require('express-session')

const PORT = process.env.PORT || config.get('port')

app.use(express.json({extended: true}))

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

app.use('/api/', require('./routes/user.route'))
app.use('/api/', require('./routes/subject.route'))
app.use('/api/', require('./routes/specialty.route'))

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

app.listen(PORT, () => {
    console.log(`App has been started on port ${PORT}...`)
});
