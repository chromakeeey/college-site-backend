require('dotenv').config();
require('express-async-errors');

const express = require('express');
const app = express();
const morgan = require('morgan');
const cors = require('cors');
const Session = require('./sessions');
const PrettyError = require('pretty-error');
const pe = new PrettyError();

app.use(cors({
    origin: ['https://amicitic.com', 'http://localhost'],
    credentials: true
}));

app.use(express.json({ extended: true }));
app.use(express.static('public'));

if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
}

app.use(Session({
    secret: process.env.SESSION_SECRET,
    store: (() => {
        if (process.env.SESSION_STORE == 'redis') {
            const RedisStore = require('./sessions/RedisStore');
            const redisClient = require('./redis/connection');

            return new RedisStore(redisClient);
        }
    
        const MemoryStore = require('./sessions/MemoryStore');
    
        return new MemoryStore();
    })(),
    expirationTime: (((60 * 1000) * 60) * 24) * 4, // 4 days
}));

app.use('/api/', require('./routes/user.route'));
app.use('/api/', require('./routes/enrollee.route'));
app.use('/api/', require('./routes/student.route'));
app.use('/api/', require('./routes/group.route'));
app.use('/api/', require('./routes/parent_number.route'));
app.use('/api/', require('./routes/teacher.route'));
app.use('/api/', require('./routes/admin.route'));
app.use('/api/', require('./routes/account_type.route'));
app.use('/api/', require('./routes/specialty.route'));
app.use('/api/', require('./routes/news.route'));

app.use('/api/', require('./routes/program.route'));
app.use('/api/', require('./routes/theme.route'));
app.use('/api/', require('./routes/grade.route'));

app.get('/', (req, res) => {
    res.end('<h1>College site API</h1>');
});

app.use((err, req, res, next) => {
    if (err.isOperational) {
        res.status(err.statusCode).json({
            message: err.message
        });
    } else {
        console.log(pe.render(err));

        res.status(500).json({
            message: 'Something went wrong.'
        });
    }

    next(err);
});

module.exports = app;
