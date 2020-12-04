require('dotenv').config();
require('express-async-errors');

const express = require('express');
const app = express();
const morgan = require('morgan');
const cors = require('cors');
const Session = require('./sessions/Session');
const PORT = process.env.PORT;

app.use(express.json({extended: true}))
app.use(cors())
app.use(morgan('dev'));

app.use(Session({
    secret: process.env.SESSION_SECRET,
    store: (() => {
        if (process.env.SESSION_STORE == 'redis') {
            const RedisStore = require('./sessions/RedisStore');
            const Redis = require('ioredis');

            return new RedisStore(new Redis({
                showFriendlyErrorStack: true
            }));
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

app.get('/', (req, res) => {
    res.end('<h1>College site API</h1>');
});

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
    console.log(`App has been started on port ${PORT}...`);
});
